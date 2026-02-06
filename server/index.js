const express = require('express');
const mongoose = require('mongoose');
const CodeShare = require('./models/CodeShare');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(helmet());
app.use(compression());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Fix the customId index issue
    try {
      console.log('Checking and fixing customId index...');
      const collection = mongoose.connection.db.collection('codeshares');
      
      // Try to drop the old index if it exists
      try {
        await collection.dropIndex('customId_1');
        console.log('Dropped old customId index');
      } catch (err) {
        console.log('Old customId index not found or already dropped');
      }
      
      // Create the new index with partial filter (don't use sparse with partialFilterExpression)
      await collection.createIndex(
        { customId: 1 },
        {
          unique: true,
          partialFilterExpression: { customId: { $exists: true } }
        }
      );
      console.log('Created new customId index with partial filter');
    } catch (err) {
      console.error('Index management error:', err);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const codeShareRoutes = require('./routes/codeShare');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/codeshare', codeShareRoutes);

// Track active users in rooms
const roomUsers = new Map();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentRoom = null;

  // Join a code sharing room
  socket.on('join-room', async (roomId) => {
    try {
      // Store the current room for this socket
      currentRoom = roomId;

      // Check if this is a custom ID
      let codeShare = await CodeShare.findOne({ customId: roomId });

      // If not found by custom ID, check if it's a MongoDB ID
      if (!codeShare && mongoose.Types.ObjectId.isValid(roomId)) {
        codeShare = await CodeShare.findById(roomId);
      }

      // If still not found, create a new code share with the custom ID
      if (!codeShare && !mongoose.Types.ObjectId.isValid(roomId)) {
        // This might be a custom ID that doesn't exist yet
        // The actual creation will happen when the GET request is made
        console.log(`User trying to join non-existent room with potential custom ID: ${roomId}`);
      }

      // Join the room
      socket.join(roomId);

      // Update user count in the room
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);

      // Emit the updated user count to all clients in the room
      const userCount = roomUsers.get(roomId).size;
      io.to(roomId).emit('user-joined', userCount);

      console.log(`User ${socket.id} joined room: ${roomId}. Total users: ${userCount}`);
    } catch (error) {
      console.error('Error in join-room:', error);
    }
  });

  // Handle code changes
  socket.on('code-change', (data) => {
    socket.to(data.roomId).emit('receive-code-change', data.code);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // If the user was in a room, update the user count
    if (currentRoom && roomUsers.has(currentRoom)) {
      roomUsers.get(currentRoom).delete(socket.id);

      const userCount = roomUsers.get(currentRoom).size;

      // Emit the updated user count to all clients in the room
      io.to(currentRoom).emit('user-left', userCount);

      // Clean up empty rooms
      if (userCount === 0) {
        roomUsers.delete(currentRoom);
      }

      console.log(`User left room: ${currentRoom}. Total users: ${userCount}`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
