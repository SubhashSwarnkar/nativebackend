const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const profileRoutes = require('./routes/profile');
const http = require('http');
const { Server } = require('socket.io');
const messageRoutes = require('./routes/messages');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FarmBros API Documentation'
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmbros_ecommerce')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO connection handler with authentication
io.on('connection', (socket) => {
  console.log('a user connected');

  // Store socket in request for message controllers
  app.set('io', io);

  // Handle socket authentication
  socket.on('authenticate', async (data) => {
    try {
      const token = data.token;
      if (!token) {
        socket.emit('authentication_error', { message: 'No token provided' });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        socket.emit('authentication_error', { message: 'Invalid token' });
        return;
      }

      // Store user info in socket
      socket.userId = user._id.toString();
      socket.user = user;

      // Join user to their personal room
      socket.join(user._id.toString());

      // If user is admin, also join admin room
      if (user.role === 'admin') {
        socket.join('admins');
      }

      // Emit authentication success
      socket.emit('authenticated', {
        message: 'Successfully authenticated',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

      console.log(`User ${user.name} (${user._id}) authenticated and joined rooms`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('authentication_error', { message: 'Authentication failed' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId, senderId } = data;
    if (receiverId && senderId) {
      socket.to(receiverId).emit('user_typing', { senderId });
    }
  });

  socket.on('stop_typing', (data) => {
    const { receiverId, senderId } = data;
    if (receiverId && senderId) {
      socket.to(receiverId).emit('user_stop_typing', { senderId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

try {
  server.listen(PORT, 'localhost', (error) => {
    if (error) {
      console.error('Error starting server:', error);
      return;
    }
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 
