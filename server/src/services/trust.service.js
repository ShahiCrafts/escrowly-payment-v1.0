const { User } = require('../models');

/**
 * Maps a trust score (0-100) to a trust level (1-5)
 * @param {number} score 
 * @returns {number}
 */
const getTrustLevel = (score) => {
    if (score >= 81) return 5;
    if (score >= 61) return 4;
    if (score >= 41) return 3;
    if (score >= 21) return 2;
    return 1;
};

/**
 * Service to handle user trust score and behavioral analytics
 */
const updateTrustScore = async (userId, eventType, transactionAmount = 0) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        let scoreChange = 0;

        switch (eventType) {
            case 'COMPLETED':
                scoreChange = 5;
                user.stats.totalCompleted += 1;
                user.stats.totalTransactionVolume += transactionAmount;
                break;
            case 'DISPUTED_LOST':
                scoreChange = -10;
                user.stats.totalDisputed += 1;
                break;
            case 'CANCELLED':
                scoreChange = -2;
                user.stats.totalCancelled += 1;
                break;
            default:
                return;
        }

        // Update and clamp trust score between 0 and 100
        user.trustScore = Math.min(100, Math.max(0, (user.trustScore || 100) + scoreChange));

        await user.save();
        return user.trustScore;
    } catch (error) {
        console.error('Error updating trust score:', error);
    }
};

module.exports = {
    updateTrustScore,
    getTrustLevel
};
