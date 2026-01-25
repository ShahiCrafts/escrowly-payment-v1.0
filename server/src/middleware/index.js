const { authenticate, optionalAuth } = require('./authenticate');
const { authorize, isAdmin, isTransactionParty } = require('./authorize');
const { generalLimiter, authLimiter, strictAuthLimiter, passwordResetLimiter, apiLimiter } = require('./rateLimiter');
const { helmetConfig, sanitizeInput, preventParameterPollution, xssClean, securityHeaders, csrfProtection } = require('./security');
const validators = require('./validators');
const { uploadSingle, uploadMultiple, uploadKYC, handleUploadError } = require('./fileUpload');
const { verifyCaptcha, conditionalCaptcha } = require('./captcha');
const { checkMaintenanceMode } = require('./maintenance');


module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  isAdmin,
  isTransactionParty,
  generalLimiter,
  authLimiter,
  strictAuthLimiter,
  passwordResetLimiter,
  apiLimiter,
  helmetConfig,
  sanitizeInput,
  preventParameterPollution,
  xssClean,
  securityHeaders,
  csrfProtection,
  validators,
  uploadSingle,
  uploadMultiple,
  uploadKYC,
  handleUploadError,
  verifyCaptcha,
  conditionalCaptcha,
  checkMaintenanceMode
};
