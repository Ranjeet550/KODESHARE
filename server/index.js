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
// CORS configuration – only allow the frontend origin that we expect.
// We avoid using '*' when credentials are enabled because browsers will reject
// the response in that case.  If FRONTEND_URL is not set we'll still accept any
// origin during development but log a warning so the problem is obvious.
const frontendUrl = process.env.FRONTEND_URL;

const corsOptions = {
  origin: (origin, callback) => {
    // log every incoming origin for diagnostics
    console.log('CORS check: origin=', origin, 'expected=', frontendUrl);

    // allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);

    if (frontendUrl) {
      if (origin === frontendUrl) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    // no FRONTEND_URL defined – permissive for local development
    console.warn('⚠️ FRONTEND_URL not set; allowing all origins (use only in development)');
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
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
console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    
    // Fix the customId index issue
    try {
      console.log('Checking and fixing customId index...');
      const collection = mongoose.connection.db.collection('codeshares');
      
      // Drop all indexes on customId field
      try {
        const indexes = await collection.listIndexes().toArray();
        for (const index of indexes) {
          if (index.key.customId === 1 && index.name !== '_id_') {
            await collection.dropIndex(index.name);
            console.log(`Dropped index: ${index.name}`);
          }
        }
      } catch (err) {
        console.log('No existing customId indexes to drop');
      }
      
      // Create the new index with partial filter
      await collection.createIndex(
        { customId: 1 },
        {
          unique: true,
          partialFilterExpression: { customId: { $exists: true } }
        }
      );
      console.log('✓ Created new customId index with partial filter');
    } catch (err) {
      console.error('Index management error:', err.message);
    }
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message);
    console.error('Full error:', err);
  });

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
