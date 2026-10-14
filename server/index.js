const express = require('express');
const mongoose = require('mongoose');
const CodeShare = require('./models/CodeShare');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const dns = require('dns');

// Load environment variables based on NODE_ENV
const path = require('path');
const fs = require('fs');
const nodeEnv = process.env.NODE_ENV || 'development';
const envFilePath = path.resolve(__dirname, `.env.${nodeEnv}`);

if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  dotenv.config(); // Fallback to default .env
}

// Fix DNS resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

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
  origin: true, // Accept all origins - we handle it in middleware
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer-when-downgrade" }
}));
app.use(compression());

// Add additional security and CORS headers BEFORE routes
app.use((req, res, next) => {
  // Set CORS headers explicitly
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://kodeshare.in',
    'https://www.kodeshare.in',
    'https://api.kodeshare.in',
    'https://kodeshare-alpha.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ];
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, X-Total-Count');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// MongoDB Connection
console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  minPoolSize: 2,
  family: 4, // Force IPv4
};

const connectMongoDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
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
      
      return true;
    } catch (err) {
      console.error(`✗ MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  console.error('✗ Failed to connect to MongoDB after all retries');
  return false;
};

connectMongoDB();

// Import routes
const authRoutes = require('./routes/auth');
const codeShareRoutes = require('./routes/codeShare');

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  };
  res.json(health);
});

// DNS test endpoint
app.get('/api/test-dns', async (req, res) => {
  const dnsPromises = require('dns').promises;
  try {
    const mongoResult = await dnsPromises.resolve4('cluster0.txsr4.mongodb.net');
    const gmailResult = await dnsPromises.resolve4('smtp.gmail.com');
    res.json({
      success: true,
      mongodb: mongoResult,
      gmail: gmailResult
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/codeshare', codeShareRoutes);

// Track active users in rooms by canonical key
const roomUsers = new Map();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentRoom = null;

  // Join a code sharing room
  socket.on('join-room', async (roomId) => {
    try {
      if (!roomId) return;
      currentRoom = String(roomId);

      // Check if this is a custom ID or a MongoDB ID
      let codeShare = await CodeShare.findOne({ customId: roomId });
      if (!codeShare && mongoose.Types.ObjectId.isValid(roomId)) {
        codeShare = await CodeShare.findById(roomId);
      }

      // Collect all room aliases for this document
      const roomsToJoin = new Set([String(roomId)]);
      if (codeShare) {
        if (codeShare._id) roomsToJoin.add(String(codeShare._id));
        if (codeShare.customId) roomsToJoin.add(String(codeShare.customId));
      }

      socket.canonicalRooms = roomsToJoin;

      // Join all alias rooms
      for (const r of roomsToJoin) {
        socket.join(r);
      }

      // Track active users by canonical key
      const canonicalKey = codeShare ? String(codeShare._id) : String(roomId);
      socket.canonicalKey = canonicalKey;

      if (!roomUsers.has(canonicalKey)) {
        roomUsers.set(canonicalKey, new Set());
      }

      const alreadyInRoom = roomUsers.get(canonicalKey).has(socket.id);
      roomUsers.get(canonicalKey).add(socket.id);

      const userCount = roomUsers.get(canonicalKey).size;

      // Only emit user-joined if this is a new socket joining the room
      if (!alreadyInRoom) {
        for (const r of roomsToJoin) {
          io.to(r).emit('user-joined', userCount);
        }
      }

      console.log(`User ${socket.id} joined room(s): ${Array.from(roomsToJoin).join(', ')}. Total users: ${userCount}`);
    } catch (error) {
      console.error('Error in join-room:', error);
    }
  });

  // Handle code changes
  socket.on('code-change', (data) => {
    if (!data) return;
    const code = data.code;
    const targetRoom = data.roomId ? String(data.roomId) : currentRoom;

    if (targetRoom) {
      socket.to(targetRoom).emit('receive-code-change', code);
    }
    if (data.aliasRoomId) {
      socket.to(String(data.aliasRoomId)).emit('receive-code-change', code);
    }
    if (socket.canonicalRooms) {
      for (const r of socket.canonicalRooms) {
        if (r !== targetRoom && r !== String(data.aliasRoomId)) {
          socket.to(r).emit('receive-code-change', code);
        }
      }
    }
  });

  // Helper to purge socket from all tracked rooms
  const handleUserLeave = () => {
    for (const [roomKey, usersSet] of roomUsers.entries()) {
      if (usersSet.has(socket.id)) {
        usersSet.delete(socket.id);
        const userCount = usersSet.size;

        io.to(roomKey).emit('user-left', userCount);
        if (socket.canonicalRooms) {
          for (const r of socket.canonicalRooms) {
            io.to(r).emit('user-left', userCount);
          }
        }

        if (userCount === 0) {
          roomUsers.delete(roomKey);
        }

        console.log(`User ${socket.id} left room: ${roomKey}. Remaining: ${userCount}`);
      }
    }
  };

  // Handle explicit leave-room
  socket.on('leave-room', () => {
    handleUserLeave();
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleUserLeave();
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
