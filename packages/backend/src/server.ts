import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { z } from "zod";
import mongoose from "mongoose";

import Peer from "./peer.js";
import { connectDB } from "./db/mongodb.js";
import { generateCode } from "./utils/code.js";
import feedbackRoute from "./routes/feedback.route.js";
import { getRandomName } from "./utils/names.js";
import { NODE_ENV, PORT } from "./config/index.js";
import logger from "./utils/logger.js";

// Services
import { UserManager } from "./services/UserManager.js";
import { FlightManager } from "./services/FlightManager.js";
import { StatManager } from "./services/StatManager.js";

const logContext = "Server";
const app = express();
const server = http.createServer(app);

// Initialize Services
const userManager = new UserManager();
const flightManager = new FlightManager(userManager);
const statManager = new StatManager();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ["https://airdelivery.site", "https://api.airdelivery.site", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
}));

// Routes
app.use("/api/v1/feedback", feedbackRoute);
app.get("/api/v1/health", (req, res) => {
    logger.debug(logContext, 'Health check request received');
    res.status(200).send("OK");
});

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: ["https://airdelivery.site", "https://api.airdelivery.site", "http://localhost:3000", ""],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Validation Schemas
const UpdateStatsSchema = z.object({
    filesShared: z.number().optional(),
    Transferred: z.number().optional()
});

const InviteSchema = z.object({
    targetId: z.string(),
    flightCode: z.string()
});

// ------------------------------------------------- 

function broadcastUsers(flightCode: string) {
    const flight = flightManager.getFlight(flightCode);
    if (!flight) return;

    const members = flightManager.getMembers(flightCode);
    
    io.to(flightCode).emit("flightUsers", {
        ownerId: flight.ownerId,
        members: members,
        ownerConnected: flight.ownerConnected
    });
}

io.on("connection", (socket) => {
    const logId = `Socket[${socket.id}]`;
    logger.debug(logId, 'New socket connected');

    const name = getRandomName();
    const peer = new Peer(socket, socket.request, { debug: NODE_ENV === 'development' });
    
    userManager.addUser(socket.id, {
        id: socket.id,
        name,
        ipPrefix: peer.ipPrefix,
        isPrivate: peer.isPrivate,
        ip: peer.ip,
        inFlight: false
    });

    socket.on("createFlight", (callback) => {
        let code;
        do {
            code = generateCode();
        } while (flightManager.hasFlight(code));

        flightManager.createFlight(code, socket.id);
        statManager.incFlights();

        socket.join(code);
        callback({ code });
        broadcastUsers(code);
    });

    socket.on("updateStats", (data) => {
        const result = UpdateStatsSchema.safeParse(data);
        if (!result.success) return;
        statManager.incStats(result.data.filesShared || 0, result.data.Transferred || 0);
    });

    socket.on("requestToConnect", (targetId, callback) => {
        if (!io.sockets.sockets.has(targetId)) {
            return callback({ success: false, message: "User not found or offline" });
        }

        let code;
        do {
            code = generateCode();
        } while (flightManager.hasFlight(code));

        flightManager.createFlight(code, socket.id);
        flightManager.joinFlight(code, targetId);

        socket.join(code);
        io.to(targetId).socketsJoin(code);

        const sender = userManager.getUser(socket.id);
        const receiver = userManager.getUser(targetId);

        io.to(code).emit("flightStarted", {
            code,
            members: [
                { id: socket.id, name: sender?.name || "Unknown" },
                { id: targetId, name: receiver?.name || "Unknown" },
            ],
        });

        callback({ success: true, code });
    });

    socket.on("inviteToFlight", (data, callback) => {
        const result = InviteSchema.safeParse(data);
        if (!result.success) return callback?.({ success: false, message: "Invalid payload" });

        const { targetId, flightCode } = result.data;
        const flight = flightManager.getFlight(flightCode);

        if (!flight || !flight.members.includes(socket.id)) {
            return callback?.({ success: false, message: "Flight not found or access denied" });
        }

        const inviter = userManager.getUser(socket.id);
        io.to(targetId).emit("invitedToFlight", {
            flightCode,
            fromId: socket.id,
            fromName: inviter?.name || "Someone",
        });
        callback?.({ success: true });
    });

    socket.on("getNearbyUsers", () => {
        const nearby = userManager.getNearbyUsers(socket.id);
        socket.emit("nearbyUsers", nearby);
    });

    socket.on("joinFlight", (code, callback) => {
        const result = flightManager.joinFlight(code, socket.id);
        if (!result.success) return callback(result);

        socket.join(code);
        const flight = flightManager.getFlight(code);
        if (flight && flight.ownerId !== socket.id) {
            socket.emit("offer", flight.ownerId, { sdp: flight.sdp });
        }

        callback({ success: true });
        broadcastUsers(code);
    });

    socket.on("offer", (code, sdp) => {
        const flight = flightManager.getFlight(code);
        if (flight) flight.sdp = sdp;
    });

    socket.on("answer", (code, { sdp }) => {
        const flight = flightManager.getFlight(code);
        if (flight && io.sockets.sockets.has(flight.ownerId)) {
            io.to(flight.ownerId).emit("answer", { id: socket.id, sdp });
        }
    });

    socket.on("ice-candidate", (payload) => {
        if (payload?.id && payload?.candidate) {
            io.to(payload.id).emit("ice-candidate", { id: socket.id, candidate: payload.candidate });
        }
    });

    socket.on("leaveFlight", () => {
        const affectedCodes = flightManager.leaveFlight(socket.id);
        affectedCodes.forEach(code => {
            if (!flightManager.hasFlight(code)) {
                io.to(code).emit("flightDeleted");
            } else {
                broadcastUsers(code);
            }
        });
    });

    socket.on("disconnect", () => {
        const affectedCodes = flightManager.leaveFlight(socket.id);
        affectedCodes.forEach(code => broadcastUsers(code));
        userManager.removeUser(socket.id);
        logger.debug(logId, 'Socket disconnected');
    });
});

async function shutdown() {
    logger.info(logContext, "Shutting down gracefully...");
    await statManager.flush();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    server.close(() => {
        logger.info(logContext, "Server closed.");
        process.exit(0);
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

if (process.env.DB_URI) {
    connectDB();
}

server.listen(PORT, () => {
    logger.info(logContext, `Server running on port ${PORT}`);
});
