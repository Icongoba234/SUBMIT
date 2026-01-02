require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const complaintRoutes = require('./routes/complaint.routes');
const adminRoutes = require('./routes/admin.routes');
const agencyRoutes = require('./routes/agency.routes');
const publicRoutes = require('./routes/public.routes');
const forumRoutes = require('./routes/forum.routes');
const homepageRoutes = require('./routes/homepage.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Allow all origins in development, or specific origin in production
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
      credentials: true
    }
  : {
      origin: true, // Allow all origins in development
      credentials: true
    };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CitizenVoice API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/homepage', homepageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

