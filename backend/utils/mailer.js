const nodemailer = require('nodemailer');

let transporter;

const initTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    // If SMTP not configured, create a stub transporter that logs messages
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('SMTP not configured. Email payload:');
        console.log(mailOptions);
        return Promise.resolve();
      }
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port: +port,
    secure: +port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html, from }) => {
  const t = initTransporter();
  const mailOptions = {
    from: from || process.env.FROM_EMAIL || 'no-reply@example.com',
    to,
    subject,
    text,
    html
  };

  return t.sendMail(mailOptions);
};

module.exports = sendEmail;
