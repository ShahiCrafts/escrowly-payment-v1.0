export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
        VERIFY_EMAIL: '/auth/verify-email',
        RESEND_VERIFICATION: '/auth/resend-verification',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password',
        MFA_SETUP: '/auth/mfa/setup',
        MFA_ENABLE: '/auth/mfa/enable',
        MFA_DISABLE: '/auth/mfa/disable',
        MFA_BACKUP_CODES: '/auth/mfa/backup-codes',
        MFA_REGENERATE_BACKUP_CODES: '/auth/mfa/regenerate-backup-codes',
        SESSIONS: '/auth/sessions',
        LOGOUT_ALL: '/auth/logout-all',
        GOOGLE: '/auth/google'
    },
    ESCROW: {
        LIST: '/escrow',
        CREATE: '/escrow',
        STATS: '/escrow/stats',
        DETAIL: (id) => `/escrow/${id}`,
        ACCEPT: (id) => `/escrow/${id}/accept`,
        DELIVER: (id) => `/escrow/${id}/deliver`,
        RELEASE: (id) => `/escrow/${id}/release`,
        DISPUTE: (id) => `/escrow/${id}/dispute`,
        CANCEL: (id) => `/escrow/${id}/cancel`
    },
    PAYMENTS: {
        CREATE_INTENT: (id) => `/payments/${id}/create-intent`,
        ONBOARDING: '/payments/onboarding',
        ONBOARDING_LINK: '/payments/onboarding/link',
        ONBOARDING_STATUS: '/payments/onboarding/status'
    },
    MESSAGES: {
        LIST: (txId) => `/messages/${txId}`,
        SEND: (txId) => `/messages/${txId}`
    },
    USER: {
        PROFILE: '/users/profile',
        NOTIFICATIONS: '/users/notifications',
        NOTIFICATION_READ: (id) => `/users/notifications/${id}/read`,
        NOTIFICATIONS_READ_ALL: '/users/notifications/read-all',
        NOTIFICATION_DELETE: (id) => `/users/notifications/${id}`
    },
    ADMIN: {
        ANALYTICS: '/admin/analytics',
        USERS: '/admin/users',
        USER_DETAIL: (id) => `/admin/users/${id}`,
        USER_ROLE: (id) => `/admin/users/${id}/role`,
        SUSPEND_USER: (id) => `/admin/users/${id}/suspend`,
        UNSUSPEND_USER: (id) => `/admin/users/${id}/unsuspend`,
        TRANSACTIONS: '/admin/transactions',
        RESOLVE_DISPUTE: (id) => `/admin/transactions/${id}/resolve`,
        AUDIT_LOGS: '/admin/audit-logs'
    }
};

export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    FUNDED: 'funded',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    DISPUTED: 'disputed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

export const TRANSACTION_STATUS_LABELS = {
    pending: 'Pending Acceptance',
    accepted: 'Awaiting Payment',
    funded: 'Funded - Awaiting Delivery',
    delivered: 'Delivered - Under Inspection',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
};

export const TRANSACTION_STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    funded: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-purple-100 text-purple-800',
    completed: 'bg-emerald-100 text-emerald-800',
    disputed: 'bg-red-100 text-red-800',
    cancelled: 'bg-neutral-100 text-neutral-800',
    refunded: 'bg-orange-100 text-orange-800'
};

export const DISPUTE_STATUS = {
    OPEN: 'open',
    UNDER_REVIEW: 'under_review',
    RESOLVED: 'resolved'
};

export const CURRENCIES = [
    { code: 'usd', symbol: '$', name: 'US Dollar' },
    { code: 'eur', symbol: '€', name: 'Euro' },
    { code: 'gbp', symbol: '£', name: 'British Pound' }
];

export const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
};

export const INSPECTION_PERIOD_DEFAULT = 14;
