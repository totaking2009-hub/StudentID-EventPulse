require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down...', err);
  process.exit(1);
});

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
  } catch (err) {
    // Traditional/local run: a broken DB connection should stop the
    // process loudly instead of starting silently broken.
    console.error(err.message);
    process.exit(1);
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`[Server] EventPulse API running on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION] Shutting down...', err);
    server.close(() => process.exit(1));
  });
};

// This file (`server.listen`) is the entry point for a traditional,
// always-on Node host (local dev, Render, Railway, a VPS, etc.) and is
// also what gives Socket.io a real persistent HTTP server to attach
// to. It is NOT used when deploying to Vercel — see api/index.js and
// the "Deployment" section of the README for why.
if (require.main === module) {
  start();
}

module.exports = { start };
