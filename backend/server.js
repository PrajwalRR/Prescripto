// server.js
import express from "express";
import cors from 'cors';
import 'dotenv/config';
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import uploadReportRoute from './routes/uploadReport.js';
import getReportsRoute from "./routes/getReports.js";
import http from 'http';
import { Server } from 'socket.io';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app and port
const app = express();
const port = process.env.PORT || 4000;

// Connect DB and Cloudinary
connectDB();
connectCloudinary();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", uploadReportRoute);
app.use("/api/user", getReportsRoute);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple health check
app.get("/", (req, res) => {
  res.send("Socket server running");
});

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // change to frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Track users in each room
const usersInRoom = {};

io.on("connection", (socket) => {
  console.log(`✅ New socket connected: ${socket.id}`);

  socket.on("join", (roomId) => {
    console.log(`📥 ${socket.id} is joining room: ${roomId}`);

    if (!usersInRoom[roomId]) {
      usersInRoom[roomId] = [];
    }

    if (!usersInRoom[roomId].includes(socket.id)) {
      usersInRoom[roomId].push(socket.id);
    }

    socket.join(roomId);

    const isInitiator = usersInRoom[roomId].length === 1;
    console.log(`📣 Sending 'initiate' to ${socket.id}, initiator: ${isInitiator}`);
    socket.emit("initiate", isInitiator);
  });

  socket.on("offer", ({ roomId, sdp }) => {
    console.log(`💬 Offer from ${socket.id} to room ${roomId}`);
    socket.to(roomId).emit("offer", sdp);
  });

  socket.on("answer", ({ roomId, sdp }) => {
    console.log(`💬 Answer from ${socket.id} to room ${roomId}`);
    socket.to(roomId).emit("answer", sdp);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    console.log(`❄️ ICE candidate from ${socket.id} to room ${roomId}`);
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
    for (const roomId in usersInRoom) {
      usersInRoom[roomId] = usersInRoom[roomId].filter(id => id !== socket.id);
      if (usersInRoom[roomId].length === 0) {
        delete usersInRoom[roomId];
      }
    }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`🚀 Server started on PORT: ${port}`);
});
