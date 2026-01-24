const https = require('https');

const verifyCaptcha = async (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && !process.env.RECAPTCHA_SECRET_KEY) {
    return next();
  }

  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ message: 'CAPTCHA verification required' });
  }

  try {
    const verified = await verifyRecaptcha(captchaToken);

    if (!verified) {
      return res.status(400).json({ message: 'CAPTCHA verification failed' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'CAPTCHA verification error' });
  }
};

const verifyRecaptcha = (token) => {
  return new Promise((resolve, reject) => {
    const postData = `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;

    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.success && response.score >= 0.5);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const conditionalCaptcha = async (req, res, next) => {
  const { User } = require('../models');

  try {
    const user = await User.findOne({ email: req.body.email });

    if (user && user.security.failedLoginAttempts >= 3) {
      return verifyCaptcha(req, res, next);
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  verifyCaptcha,
  conditionalCaptcha
};
