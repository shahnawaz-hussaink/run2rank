require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDatabase } = require('./db/database');
const errorHandler = require('./middleware/error-handler');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const runRoutes = require('./routes/runs');
const healthDataRoutes = require('./routes/health-data');
const monthlyStatsRoutes = require('./routes/monthly-stats');
const presenceRoutes = require('./routes/presence');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
console.log('🔧 Initializing database...');
initDatabase();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/health_data', healthDataRoutes);
app.use('/api/monthly_stats', monthlyStatsRoutes);
app.use('/api/user_presence', presenceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📊 API available at: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  const { closeDatabase } = require('./db/database');
  closeDatabase();
  process.exit(0);
});
