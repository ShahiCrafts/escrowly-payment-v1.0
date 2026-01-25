const { User } = require('../models');
const logger = require('../utils/logger');

const TIER_LIMITS = {
    starter: {
        monthlyVolume: 50000, // NPR 50,000
        transactionCount: 5,
        maxSingleTransaction: 15000
    },
    pro: {
        monthlyVolume: 1000000, // NPR 1,000,000
        transactionCount: 50,
        maxSingleTransaction: 200000
    }
};

/**
 * Get the current tier and limits for a user
 */
const getUserTier = (user) => {
    const tier = user.kyc?.status === 'verified' ? 'pro' : 'starter';
    return {
        tier,
        limits: TIER_LIMITS[tier]
    };
};

/**
 * Check if the user needs a monthly limit reset
 */
const checkAndResetUsage = async (user) => {
    const now = new Date();
    const lastReset = user.stats?.monthlyUsage?.lastResetAt || user.createdAt;

    const isNewMonth = lastReset.getMonth() !== now.getMonth() ||
        lastReset.getFullYear() !== now.getFullYear();

    if (isNewMonth) {
        user.stats.monthlyUsage = {
            amount: 0,
            count: 0,
            lastResetAt: now
        };
        await user.save();
        logger.info(`Monthly usage reset for user ${user._id}`);
    }
    return user;
};

/**
 * Validate a transaction against user limits
 */
const validateTransactionLimits = async (user, amount) => {
    await checkAndResetUsage(user);
    const { tier, limits } = getUserTier(user);
    const usage = user.stats.monthlyUsage;

    // 1. Check Max Single Transaction
    if (amount > limits.maxSingleTransaction) {
        throw new Error(`Single transaction limit exceeded for ${tier} tier. Max: NPR ${limits.maxSingleTransaction}`);
    }

    // 2. Check Monthly Volume
    if (usage.amount + amount > limits.monthlyVolume) {
        throw new Error(`${tier.toUpperCase()} Tier Monthly volume limit reached. You can still use NPR ${limits.monthlyVolume - usage.amount} this month.`);
    }

    // 3. Check Transaction Count
    if (usage.count >= limits.transactionCount) {
        throw new Error(`${tier.toUpperCase()} Tier Monthly transaction count reached. Upgrade via KYC to increase limits.`);
    }

    return true;
};

/**
 * Record usage after successful transaction creation/funding
 */
const recordUsage = async (userId, amount) => {
    const user = await User.findById(userId);
    if (!user) return;

    await checkAndResetUsage(user);

    user.stats.monthlyUsage.amount += amount;
    user.stats.monthlyUsage.count += 1;

    await user.save();
    logger.info(`Usage recorded for user ${userId}: +NPR ${amount}`);
};

/**
 * Get usage statistics for the UI
 */
const getUsageStats = async (user) => {
    await checkAndResetUsage(user);
    const { tier, limits } = getUserTier(user);
    const usage = user.stats.monthlyUsage;

    return {
        tier: tier === 'pro' ? 'Verified (Pro)' : 'Basic (Starter)',
        volume: {
            used: usage.amount,
            limit: limits.monthlyVolume,
            percentage: Math.min(100, (usage.amount / limits.monthlyVolume) * 100)
        },
        count: {
            used: usage.count,
            limit: limits.transactionCount,
            percentage: Math.min(100, (usage.count / limits.transactionCount) * 100)
        },
        tierRaw: tier
    };
};

module.exports = {
    getUserTier,
    validateTransactionLimits,
    recordUsage,
    getUsageStats
};
