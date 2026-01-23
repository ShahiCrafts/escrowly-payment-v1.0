require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startAutoReleaseJob } = require('./src/jobs/autoRelease');

const http = require('http');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

connectDB().then(() => {
  startAutoReleaseJob();

  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to connect to database', err);
  process.exit(1);
});

// Global Error Handlers for debugging
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  // process.exit(1); // Keep alive for debugging if possible, but usually restarting is safer. 
  // For now, let's keep it running to see subsequent logs if any, or at least ensure it prints before death.
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  logger.error('Unhandled Rejection', { error: err.message, stack: err.stack });
  process.exit(1);
});
