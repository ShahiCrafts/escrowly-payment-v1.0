const { SystemSetting, User } = require('../models');
const { verifyAccessToken } = require('../utils/tokens');

const checkMaintenanceMode = async (req, res, next) => {
    try {
        // 1. Check if maintenance mode is enabled
        const setting = await SystemSetting.findOne({ key: 'maintenanceMode' });
        const isMaintenanceMode = setting?.value === true;

        if (!isMaintenanceMode) {
            return next();
        }

        // 2. If enabled, allow admins to bypass
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = verifyAccessToken(token);
                // Note: The token payload has "userId", not "id"
                const user = await User.findById(decoded.userId);

                if (user && user.role === 'admin') {
                    // Add a header to indicate maintenance bypass
                    res.set('X-Maintenance-Bypass', 'true');
                    return next();
                }
            } catch (err) {
                // Token invalid or user not found - treat as normal user
            }
        }

        // 3. Block access for everyone else
        // 3. Block access for everyone else
        // Allow login and critical auth endpoints so admins can log in/refresh
        const allowedPaths = [
            '/api/auth/login',
            '/api/auth/refresh',
            '/api/csrf-token'
        ];

        if (allowedPaths.some(path => req.path === path)) {
            return next();
        }

        // Also allow admin-specific public endpoints if any (none usually)

        return res.status(503).json({
            message: 'System is currently under maintenance. Please try again later.',
            maintenance: true
        });

    } catch (error) {
        console.error('Maintenance middleware error:', error);
        next(); // Fail open if DB error
    }
};

module.exports = { checkMaintenanceMode };
