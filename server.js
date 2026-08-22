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
  await connectDB();

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

start();
