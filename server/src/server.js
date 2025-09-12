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
import { DB_URI, ENABLE_ANALYTICS, NODE_ENV, PORT } from "./config/index.js";



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
app.use("/api/v1/feedback" ,feedbackRoute);
app.get("/api/v1/health", (req, res) => {
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
    if (!user || !user.ipPrefix) return;

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

    socket.emit("nearbyUsers", nearby);
}


function broadcastUsers(flightCode) {
    const flight = flights.get(flightCode);
    if (!flight) return;

    io.to(flightCode).emit("flightUsers", {
        ownerId: flight.ownerId,
        members: flight.members.map(id => ({
            id,
            name: users.get(id)?.name || "Unknown"
        })),
        ownerConnected: flight.ownerConnected
    });
}


// socket 
io.on("connection", (socket) => {

    const name = getRandomName();


    const peer = new Peer(socket, socket.request, { debug : NODE_ENV === 'development' });
    users.set(socket.id, { name, ipPrefix: peer.ipPrefix, isPrivate: peer.isPrivate, ip: peer.ip, inFlight: false });


    socket.on("createFlight", (callback) => {
        let code;
        do {
            code = generateCode();
        } while (flights.has(code));

        flights.set(code, {
            ownerId: socket.id,
            members: [socket.id],
            ownerConnected: true,
        });

        const user = users.get(socket.id);
        if (user) {
            user.inFlight = true;
            users.set(socket.id, user);
        }

        if(ENABLE_ANALYTICS ){
            if(!DB_URI) {
                console.log(
                    "[MongoDB] Skipping MongoDB connection."
                );
                return;
            }
            Stat.updateOne(
            { date: { $gte: new Date().setHours(0, 0, 0, 0) } },
            { $inc: { totalFlights: 1 } },
            { upsert: true }
        ).exec();}
        socket.join(code);
        callback({ code });

        broadcastUsers(code);
    });

    socket.on("updateStats", ({ filesShared, Transferred }) => {


        // Data recived in MB 
        if(ENABLE_ANALYTICS){
            if(!DB_URI) {
                console.log(
                    "[MongoDB] Skipping MongoDB connection."
                );
                return;
            }
            Stat.updateOne(
            { date: { $gte: new Date().setHours(0, 0, 0, 0) } },
            {
                $inc: {
                    totalFilesShared: filesShared || 0,
                    totalMBTransferred: Transferred || 0,
                },
            },
            { upsert: true }
        ).exec();}
    });



    socket.on("requestToConnect", (targetId, callback) => {
        if (!io.sockets.sockets.has(targetId)) {
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
        const flight = flights.get(flightCode);
        if (!flight) {
            callback?.({ success: false, message: "Flight not found" });
            return;
        }

        if (!flight.members.includes(socket.id)) {
            callback?.({ success: false, message: "You are not part of this flight" });
            return;
        }

        if (!io.sockets.sockets.has(targetId)) {
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

        callback?.({ success: true });
    });

    socket.on("getNearbyUsers", () => {
        broadcastNearbyUsers(socket);
    });

    socket.on("joinFlight", (code, callback) => {


        if (flights.has(code)) {
            const flight = flights.get(code);

            if (flight.members.length >= 2) {
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

            // USER LOG 
            if (NODE_ENV === 'development') {
                console.log("SUCCESS USER JOINs : ", code);
            }


            callback({ success: true });
            broadcastUsers(code);
        } else {

            console.log("Failed");
            callback({ success: false, message: "flight not found" });
        }
    });
    socket.on("offer", (code, sdp) => {
        const flight = flights.get(code);
        if (!flight) {
            console.error(`No flight found for code: ${code}`);
            return;
        }
        flight.sdp = sdp;

    });
    socket.on("answer", (code, { sdp }) => {
        const flight = flights.get(code);
        if (flight && io.sockets.sockets.get(flight.ownerId)) {
            io.to(flight.ownerId).emit("answer", { from: socket.id, sdp });
        }
    });

    socket.on("ice-candidate", (payload) => {
        if (payload && payload.id && payload.candidate) {
            io.to(payload.id).emit("ice-candidate", { from: socket.id, candidate: payload.candidate });
        }
    });

    socket.on("leaveFlight", () => {
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
                break;
            } else {
                const wasMember = flight.members.includes(socket.id);
                flight.members = flight.members.filter(id => id !== socket.id);
                if (wasMember) {
                    broadcastUsers(code);
                    break;
                }
            }
        }

        if (flightCodeToDelete) {
            flights.delete(flightCodeToDelete);
        }
    });

    socket.on("disconnect", () => {

        users.delete(socket.id);


        for (const [code, flight] of flights.entries()) {

            if (flight.ownerId === socket.id) {

                flight.ownerConnected = false;
                broadcastUsers(code);
                flights.delete(code);
            } else {

                flight.members = flight.members.filter(id => id !== socket.id);
                broadcastUsers(code);
            }
        }

    });

    socket.emit("yourName", { id: socket.id, name });
});


setInterval(() => {
    for (const [code, flight] of flights.entries()) {
        const inactiveTooLong = flight.members.length === 0 || !flight.ownerConnected;
        if (inactiveTooLong) {
            flights.delete(code);
            console.log(`[CLEANUP] Removed inactive flight: ${code}`);
        }
    }
}, 120 * 1000); // every 120 seconds




server.listen(PORT, async () => {
    try {
        await connectDB()
        console.log(` Server running on port ${PORT}`);
    } catch (err) {
        console.error(' DB connection failed:', err.message)
        process.exit(1)
    }
});

process.on('SIGINT', () => {
    console.log(' Shutting down...');
    server.close(async () => {
        await mongoose.disconnect();
        console.log('  DB connection closed.');
        process.exit(0);
    });
});
