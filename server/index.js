require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startAutoReleaseJob } = require('./src/jobs/autoRelease');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startAutoReleaseJob();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to connect to database', err);
  process.exit(1);
});
