const cron = require('node-cron');
const { escrowService } = require('../services');
const logger = require('../utils/logger');

const startAutoReleaseJob = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running auto-release job');

    try {
      const count = await escrowService.autoReleaseExpiredInspections();
      logger.info(`Auto-release job completed. Released ${count} transactions.`);
    } catch (error) {
      logger.error('Auto-release job failed', error);
    }
  });

  logger.info('Auto-release job scheduled (runs every hour)');
};

module.exports = { startAutoReleaseJob };
