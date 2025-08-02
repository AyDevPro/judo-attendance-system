// Alternative Gmail gratuite et illimitée
import nodemailer from 'nodemailer';
export { createVerificationEmailTemplate } from './email';

export async function sendEmailGmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    // Si pas de config Gmail, on log seulement
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log(`📧 [MODE DEV] Email Gmail à envoyer:
        Destinataire: ${to}
        Sujet: ${subject}
        Contenu: ${html}
      `);
      return { id: 'gmail-dev-mode', message: 'Email logged in development mode' };
    }

    // Configuration Gmail
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Envoi réel
    const info = await transporter.sendMail({
      from: `"Système Judo" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('✅ Email Gmail envoyé avec succès:', info.messageId);
    return { id: info.messageId };
  } catch (error) {
    console.error('❌ Erreur Gmail:', error);
    throw error;
  }
}