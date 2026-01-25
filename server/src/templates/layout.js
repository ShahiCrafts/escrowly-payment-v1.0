const baseLayout = (content, title, color = '#3b82f6') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .header { background: ${color}; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
    .content { padding: 40px 32px; }
    .content h2 { color: #0f172a; margin: 0 0 24px 0; font-size: 18px; font-weight: 700; }
    .body-text { color: #475569; font-size: 15px; line-height: 1.6; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    .btn { background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin: 24px 0; }
    .otp-box { background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: 700; color: #1e293b; letter-spacing: 4px; margin: 24px 0; border: 1px solid #e2e8f0; }
    .alert-box { padding: 16px; border-radius: 12px; margin: 24px 0; border-left: 4px solid; }
    .alert-info { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .alert-success { background: #f0fdf4; border-color: #16a34a; color: #166534; }
    .alert-warning { background: #fff7ed; border-color: #f97316; color: #9a3412; }
    .alert-danger { background: #fef2f2; border-color: #dc2626; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Escrowly</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <div class="body-text">
        ${content}
      </div>
      <div class="footer">
        <p>
          &copy; ${new Date().getFullYear()} Escrowly. All rights reserved.<br>
          Secure Online Transactions Professionals.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = baseLayout;
