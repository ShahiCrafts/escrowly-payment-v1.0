const { body, param, query, validationResult } = require('express-validator');
const zxcvbn = require('zxcvbn');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const passwordValidator = body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one digit')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one special character')
    .custom((value, { req }) => {
        const inputs = [req.body.email];
        if (req.body.firstName) inputs.push(req.body.firstName);
        if (req.body.lastName) inputs.push(req.body.lastName);
        if (req.user) {
            if (req.user.profile?.firstName) inputs.push(req.user.profile.firstName);
            if (req.user.profile?.lastName) inputs.push(req.user.profile.lastName);
        }

        const result = zxcvbn(value, inputs);
        if (result.score < 3) {
            throw new Error('Password is too weak. Avoid common patterns and personal information.');
        }
        return true;
    });

const emailValidator = body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters');

const registerValidation = [
    emailValidator,
    passwordValidator,
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s-]+$/)
        .withMessage('First name can only contain letters, spaces, and hyphens'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s-]+$/)
        .withMessage('Last name can only contain letters, spaces, and hyphens'),
    body('phone')
        .optional()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Invalid phone number format'),
    validate
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    body('mfaToken')
        .optional()
        .isLength({ min: 6, max: 8 })
        .withMessage('Invalid MFA token'),
    validate
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        }),
    // Reuse the robust passwordValidator but map it to 'newPassword' field
    body('newPassword')
        .isLength({ min: 12 })
        .withMessage('Password must be at least 12 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one digit')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Password must contain at least one special character')
        .custom((value, { req }) => {
            const inputs = [];
            if (req.user) {
                if (req.user.email) inputs.push(req.user.email);
                if (req.user.profile?.firstName) inputs.push(req.user.profile.firstName);
                if (req.user.profile?.lastName) inputs.push(req.user.profile.lastName);
            } else if (req.body.email) {
                inputs.push(req.body.email);
            }

            const result = zxcvbn(value, inputs);
            if (result.score < 3) {
                throw new Error('Password is too weak. Avoid common patterns and personal information.');
            }
            return true;
        }),
    validate
];

const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 12 })
        .withMessage('Password must be at least 12 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one digit')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Password must contain at least one special character'),
    validate
];

const createTransactionValidation = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must be less than 2000 characters'),
    body('amount')
        .isFloat({ min: 1, max: 1000000 })
        .withMessage('Amount must be between 1 and 1,000,000'),
    body('currency')
        .optional()
        .isIn(['usd', 'eur', 'gbp', 'npr', 'inr'])
        .withMessage('Currency must be usd, eur, gbp, npr, or inr'),
    body('sellerEmail')
        .optional()
        .isEmail()
        .withMessage('Invalid seller email')
        .normalizeEmail(),
    body('buyerEmail')
        .optional()
        .isEmail()
        .withMessage('Invalid buyer email')
        .normalizeEmail(),
    body('inspectionPeriod')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Inspection period must be between 1 and 30 days'),
    body('milestones')
        .optional()
        .isArray()
        .withMessage('Milestones must be an array'),
    body('milestones.*.title')
        .if(body('milestones').exists())
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Milestone title is required'),
    body('milestones.*.amount')
        .if(body('milestones').exists())
        .isFloat({ min: 0 })
        .withMessage('Milestone amount must be positive'),
    validate
];

const disputeValidation = [
    body('reason')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Dispute reason must be between 10 and 2000 characters'),
    validate
];

const messageValidation = [
    body('content')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Message must be less than 5000 characters'),
    validate
];

const profileUpdateValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('phoneNumber')
        .optional()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Invalid phone number format'),
    validate
];

const mongoIdParam = param('id')
    .isMongoId()
    .withMessage('Invalid ID format');

const validateMongoId = [
    mongoIdParam,
    validate
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    changePasswordValidation,
    resetPasswordValidation,
    createTransactionValidation,
    disputeValidation,
    messageValidation,
    profileUpdateValidation,
    validateMongoId
};
