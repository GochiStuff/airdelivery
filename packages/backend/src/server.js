import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Stat } from "./model/stats.model.js";
import { connectDB } from "./db/mongodb.js";
import cors from "cors";
import Peer from "./peer.js";
import { generateCode } from "./utils/code.js";
import feedbackRoute from "./routes/feedback.route.js"
import { getRandomName } from "./utils/names.js";
import { NODE_ENV, PORT } from "./config/index.js";
import mongoose from "mongoose"; // Added import for SIGINT handler
import logger from "./utils/logger.js"; // Import the new logger

const logContext = "Server";

// { ownerId: socketId, members: [socketId] }
const flights = new Map();
// socketid -> { name, ipPrefix, inFlight: boolean }
const users = new Map(); // this is called users but is handling users .


const app = express();
const server = http.createServer(app);

// middleware
app.use(express.json());
app.use(cors({
    origin: ["https://airdelivery.site", "https://api.airdelivery.site", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
}));


// routes

// rest . 
app.use("/api/v1/feedback", feedbackRoute);
app.get("/api/v1/health", (req, res) => {
    logger.debug(logContext, 'Health check request received');
    res.status(200).send("OK");
});


// socket
const io = new Server(server, {
    cors: {
        origin: ["https://airdelivery.site", "https://api.airdelivery.site", "http://localhost:3000", ""],
        methods: ["GET", "POST"],
        credentials: true
    }
});


// ------------------------------------------------- 

// Helper .

function broadcastNearbyUsers(socket) {
    const user = users.get(socket.id);
    if (!user || !user.ipPrefix) {
        logger.debug('broadcastNearbyUsers', 'User or IP prefix not found, skipping.', { socketId: socket.id });
        return;
    }

    const nearby = Array.from(users.entries())
        .filter(([id, data]) => {
            if (id === socket.id || data.inFlight || !data.ipPrefix) return false;

            // LAN users must be private and same /24
            if (user.isPrivate && data.isPrivate) {
                return data.ipPrefix === user.ipPrefix;
            }

            // Public IP case (e.g  mobile hotspot): allow same /16 public
            if (!user.isPrivate && !data.isPrivate) {
                return data.ipPrefix === user.ipPrefix;
            }

            // Don’t mix public & private or mismatch
            return false;
        })
        .map(([id, data]) => ({ id, name: data.name }));

    logger.debug('broadcastNearbyUsers', `Broadcasting ${nearby.length} nearby users.`, { socketId: socket.id });
    socket.emit("nearbyUsers", nearby);
}


function broadcastUsers(flightCode) {
    const flight = flights.get(flightCode);
    if (!flight) {
        logger.debug('broadcastUsers', 'Flight not found, skipping broadcast.', { flightCode });
        return;
    }

    const members = flight.members.map(id => ({
        id,
        name: users.get(id)?.name || "Unknown"
    }));

    logger.debug('broadcastUsers', 'Broadcasting flight users', { flightCode, memberCount: members.length, ownerId: flight.ownerId });

    io.to(flightCode).emit("flightUsers", {
        ownerId: flight.ownerId,
        members: members,
        ownerConnected: flight.ownerConnected
    });
}


// socket 
io.on("connection", (socket) => {
    const logContext = `Socket[${socket.id}]`;
    logger.debug(logContext, 'New socket connected');

    const name = getRandomName();


    const peer = new Peer(socket, socket.request, { debug: NODE_ENV === 'development' });
    users.set(socket.id, { name, ipPrefix: peer.ipPrefix, isPrivate: peer.isPrivate, ip: peer.ip, inFlight: false });
    logger.debug(logContext, 'User created and stored', { name, ipPrefix: peer.ipPrefix, ip: peer.ip });


    socket.on("createFlight", (callback) => {
        logger.debug(logContext, 'Event: createFlight');
        let code;
        do {
            code = generateCode();
        } while (flights.has(code));

        flights.set(code, {
            ownerId: socket.id,
            members: [socket.id],
            ownerConnected: true,
        });
        logger.debug(logContext, `Flight created`, { code });

        const user = users.get(socket.id);
        if (user) {
            user.inFlight = true;
            users.set(socket.id, user);
        }
        if (process.env.DB_URI) {
            Stat.updateOne(
                { date: { $gte: new Date().setHours(0, 0, 0, 0) } },
                { $inc: { totalFlights: 1 } },
                { upsert: true }
            ).exec();
        }

        socket.join(code);
        callback({ code });

        broadcastUsers(code);
    });

    socket.on("updateStats", ({ filesShared, Transferred }) => {
        logger.debug(logContext, 'Event: updateStats', { filesShared, Transferred });

        // Data recived in MB 
        if (process.env.DB_URI) {
            Stat.updateOne(
                { date: { $gte: new Date().setHours(0, 0, 0, 0) } },
                {
                    $inc: {
                        totalFilesShared: filesShared || 0,
                        totalMBTransferred: Transferred || 0,
                    },
                },
                { upsert: true }
            ).exec();
        }

    });



    socket.on("requestToConnect", (targetId, callback) => {
        logger.debug(logContext, 'Event: requestToConnect', { targetId });
        if (!io.sockets.sockets.has(targetId)) {
            logger.warn(logContext, 'requestToConnect: Target user not found', { targetId });
            callback({ success: false, message: "User not found or offline" });
            return;
        }

        let code;
        do {
            code = generateCode();
        } while (flights.has(code));

        // Create a flight between this socket and targetId
        flights.set(code, {
            ownerId: socket.id,
            members: [socket.id, targetId],
            ownerConnected: true,
            disconnectTimeout: null,
        });
        logger.debug(logContext, 'requestToConnect: P2P flight created', { code, members: [socket.id, targetId] });

        socket.join(code);
        io.to(targetId).socketsJoin(code);

        // Inform both clients about the room code and participants
        const senderName = users.get(socket.id)?.name || "Unknown";
        const receiverName = users.get(targetId)?.name || "Unknown";

        io.to(code).emit("flightStarted", {
            code,
            members: [
                { id: socket.id, name: senderName },
                { id: targetId, name: receiverName },
            ],
        });

        callback({ success: true, code });
    });


    socket.on("inviteToFlight", ({ targetId, flightCode }, callback) => {
        logger.debug(logContext, 'Event: inviteToFlight', { targetId, flightCode });
        const flight = flights.get(flightCode);
        if (!flight) {
            logger.warn(logContext, 'inviteToFlight: Flight not found', { flightCode });
            callback?.({ success: false, message: "Flight not found" });
            return;
        }

        if (!flight.members.includes(socket.id)) {
            logger.warn(logContext, 'inviteToFlight: User not part of flight', { flightCode });
            callback?.({ success: false, message: "You are not part of this flight" });
            return;
        }

        if (!io.sockets.sockets.has(targetId)) {
            logger.warn(logContext, 'inviteToFlight: Target user not connected', { targetId });
            callback?.({ success: false, message: "Target user not connected" });
            return;
        }



        // Notify the invited user to go to the flight page
        const inviterName = users.get(socket.id)?.name || "Someone";

        io.to(targetId).emit("invitedToFlight", {
            flightCode,
            fromId: socket.id,
            fromName: inviterName,
        });
        logger.debug(logContext, 'inviteToFlight: Invite sent successfully', { targetId, flightCode });
        callback?.({ success: true });
    });

    socket.on("getNearbyUsers", () => {
        logger.debug(logContext, 'Event: getNearbyUsers');
        broadcastNearbyUsers(socket);
    });

    socket.on("joinFlight", (code, callback) => {
        logger.debug(logContext, 'Event: joinFlight', { code });

        if (flights.has(code)) {
            const flight = flights.get(code);

            if (flight.members.length >= 2) {
                logger.warn(logContext, 'joinFlight: Flight is full', { code });
                callback({ success: false, message: "Flight is full" });
                return;
            }



            socket.join(code);
            if (flight.ownerId !== socket.id) {
                flight.members.push(socket.id);
                socket.emit("offer", flight.ownerId, { sdp: flight.sdp });
            }

            const user = users.get(socket.id);
            if (user) {
                user.inFlight = true;
                users.set(socket.id, user);
            }

            logger.debug(logContext, 'joinFlight: User joined successfully', { code });


            callback({ success: true });
            broadcastUsers(code);
        } else {
            logger.warn(logContext, 'joinFlight: Flight not found', { code });
            callback({ success: false, message: "flight not found" });
        }
    });
    socket.on("offer", (code, sdp) => {
        logger.debug(logContext, 'Event: offer', { code });
        const flight = flights.get(code);
        if (!flight) {
            logger.error(logContext, `offer: No flight found for code: ${code}`);
            return;
        }
        flight.sdp = sdp;

    });
    socket.on("answer", (code, { sdp }) => {
        logger.debug(logContext, 'Event: answer', { code });
        const flight = flights.get(code);
        if (flight && io.sockets.sockets.get(flight.ownerId)) {
            io.to(flight.ownerId).emit("answer", { id: socket.id, sdp });
        } else {
            logger.warn(logContext, 'answer: Could not send answer, flight or owner not found', { code, ownerId: flight?.ownerId });
        }
    });

    socket.on("ice-candidate", (payload) => {
        logger.debug(logContext, 'Event: ice-candidate', { to: payload?.id });
        if (payload && payload.id && payload.candidate) {
            io.to(payload.id).emit("ice-candidate", { id: socket.id, candidate: payload.candidate });
        } else {
            logger.warn(logContext, 'ice-candidate: Invalid payload received', { payload });
        }
    });

    socket.on("leaveFlight", () => {
        logger.debug(logContext, 'Event: leaveFlight');
        const user = users.get(socket.id);
        if (user) {
            user.inFlight = false;
            users.set(socket.id, user);
        }

        let flightCodeToDelete = "";

        for (const [code, flight] of flights.entries()) {
            if (flight.ownerId === socket.id) {
                flight.ownerConnected = false;
                broadcastUsers(code);
                flightCodeToDelete = code;
                logger.debug(logContext, 'leaveFlight: Owner left, marking flight for deletion', { code });
                break;
            } else {
                const wasMember = flight.members.includes(socket.id);
                flight.members = flight.members.filter(id => id !== socket.id);
                if (wasMember) {
                    logger.debug(logContext, 'leaveFlight: Member left', { code });
                    broadcastUsers(code);
                    break;
                }
            }
        }

        if (flightCodeToDelete) {
            flights.delete(flightCodeToDelete);
            logger.debug(logContext, 'leaveFlight: Flight deleted', { code: flightCodeToDelete });
        }
    });

    socket.on("disconnect", () => {
        logger.debug(logContext, 'Event: disconnect');
        users.delete(socket.id);

        for (const [code, flight] of flights.entries()) {

            if (flight.ownerId === socket.id) {
                logger.debug(logContext, 'disconnect: Owner disconnected, deleting flight', { code });
                flight.ownerConnected = false;
                broadcastUsers(code);
                flights.delete(code);
            } else {
                const initialCount = flight.members.length;
                flight.members = flight.members.filter(id => id !== socket.id);
                if (initialCount > flight.members.length) {
                    logger.debug(logContext, 'disconnect: Member disconnected, removed from flight', { code });
                    broadcastUsers(code);
                }
            }
        }

    });

    socket.emit("yourName", { id: socket.id, name });
});


setInterval(() => {
    logger.debug('Cleanup', 'Running inactive flight cleanup task...');
    for (const [code, flight] of flights.entries()) {
        const inactiveTooLong = flight.members.length === 0 || !flight.ownerConnected;
        if (inactiveTooLong) {
            flights.delete(code);
            logger.info('Cleanup', `Removed inactive flight: ${code}`);
        }
    }
}, 120 * 1000); // every 120 seconds




server.listen(PORT, async () => {
    try {
        if (!process.env.DB_URI) {
            logger.info(logContext, `Server running on port ${PORT}, skipping DB connection (DEV mode)`);
        } else {
            await connectDB()
            logger.info(logContext, `Server running on port ${PORT}, DB connected`);
        }
    } catch (err) {
        logger.error(logContext, 'DB connection failed on startup', err);
        process.exit(1)
    }
});

process.on('SIGINT', () => {
    logger.info('Process', 'Shutting down...');
    server.close(async () => {
        if (process.env.DB_URI) {
            await mongoose.disconnect();
            logger.info('Process', 'DB connection closed.');
        }
        process.exit(0);
    });
});