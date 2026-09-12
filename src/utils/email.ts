import nodemailer from 'nodemailer';

const sendEmail = async (options: { to: string; subject: string; html: string }) => {
  const user = String(process.env.EMAIL_USER || '').trim();
  const pass = String(process.env.EMAIL_PASS || '').trim();
  if (!user || !pass) throw new Error('Email service is not configured');
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  return await transporter.sendMail({
    from: `"DENFIT" <${user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

export default sendEmail;
