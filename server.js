require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());

app.use(express.json({
  limit: '2mb'
}));

app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

// API routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload'
    });
  }

  res.status(err.status || 500).json({
    error: 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`NeuroTrack API listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server startup error:', err.message);
  process.exitCode = 1;
});

module.exports = app;
