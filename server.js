require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const validator = require('validator');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again after 15 minutes.' }
});

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function validateContactPayload(body) {
  const fullName = cleanText(body.fullName, 80);
  const emailAddress = cleanText(body.emailAddress, 120).toLowerCase();
  const phoneNumber = cleanText(body.phoneNumber, 30);
  const subject = cleanText(body.subject, 120);
  const message = String(body.message || '').replace(/[<>]/g, '').trim().slice(0, 1500);
  const website = cleanText(body.website, 120);

  if (website) return { spam: true, message: 'Spam detected.' };
  if (!fullName || fullName.length < 2) return { error: 'Please enter a valid full name.' };
  if (!validator.isEmail(emailAddress)) return { error: 'Please enter a valid email address.' };
  if (phoneNumber && !validator.isMobilePhone(phoneNumber, 'any', { strictMode: false })) return { error: 'Please enter a valid phone number.' };
  if (!subject || subject.length < 3) return { error: 'Please enter a valid subject.' };
  if (!message || message.length < 10) return { error: 'Please write a message of at least 10 characters.' };

  const spamWords = ['casino', 'crypto investment', 'loan offer', 'viagra', 'adult dating'];
  const lowered = `${fullName} ${emailAddress} ${subject} ${message}`.toLowerCase();
  if (spamWords.some(word => lowered.includes(word))) return { spam: true, message: 'Spam detected.' };

  return { data: { fullName, emailAddress, phoneNumber, subject, message } };
}

async function saveMessage(data, req) {
  const dataDir = path.join(__dirname, 'messages');
  await fs.mkdir(dataDir, { recursive: true });
  const file = path.join(dataDir, 'contact-messages.jsonl');
  const record = {
    ...data,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
    createdAt: new Date().toISOString()
  };
  await fs.appendFile(file, JSON.stringify(record) + '\n', 'utf8');
}

function getEmailConfig() {
  const SMTP_HOST = cleanText(process.env.SMTP_HOST, 120);
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
  const SMTP_USER = cleanText(process.env.SMTP_USER, 160);
  const SMTP_PASS = String(process.env.SMTP_PASS || '').trim();
  const CONTACT_TO_EMAIL = cleanText(process.env.CONTACT_TO_EMAIL, 160);

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !CONTACT_TO_EMAIL) {
    throw new Error('Email service is not configured. Please check your .env / Render environment variables.');
  }

  return { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL };
}

async function sendEmail(data) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL } = getEmailConfig();

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const safeSubject = validator.escape(data.subject);

  await transporter.sendMail({
    // Gmail SMTP will always show the authenticated SMTP_USER as sender.
    // The visitor email is added as replyTo, so pressing Reply goes to the visitor.
    from: `Portfolio Contact <${SMTP_USER}>`,
    to: CONTACT_TO_EMAIL,
    replyTo: data.emailAddress,
    subject: `Portfolio Contact: ${data.subject}`,
    text: `Name: ${data.fullName}\nEmail: ${data.emailAddress}\nPhone: ${data.phoneNumber || 'Not provided'}\nSubject: ${data.subject}\n\nMessage:\n${data.message}`,
    html: `
      <h2>New Portfolio Message</h2>
      <p><strong>Name:</strong> ${validator.escape(data.fullName)}</p>
      <p><strong>Email:</strong> ${validator.escape(data.emailAddress)}</p>
      <p><strong>Phone:</strong> ${validator.escape(data.phoneNumber || 'Not provided')}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Message:</strong></p>
      <p>${validator.escape(data.message).replace(/\n/g, '<br>')}</p>
    `
  });

  return { sent: true };
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running.' });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const validation = validateContactPayload(req.body);

    if (validation.spam) {
      return res.status(200).json({ success: true, message: 'Message received.' });
    }

    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    await saveMessage(validation.data, req);

    try {
      await sendEmail(validation.data);
    } catch (emailError) {
      console.error('Email delivery failed:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Message was saved, but email delivery failed. Please check SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL and your Gmail App Password.'
      });
    }

    return res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    if (NODE_ENV !== 'production') console.error(error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Portfolio running on http://localhost:${PORT}`);
});
