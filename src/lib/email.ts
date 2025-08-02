// src/lib/email.ts
// Configuration pour l'envoi d'emails avec Resend

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    // Si pas de clé API configurée, on log seulement
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "YOUR_RESEND_API_KEY_HERE"
    ) {
      console.log(`📧 [MODE DEV] Email à envoyer:
        Destinataire: ${to}
        Sujet: ${subject}
        Contenu: ${html}
      `);
      return { id: "dev-mode", message: "Email logged in development mode" };
    }

    // Envoi réel avec Resend
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [to],
      subject: subject,
      html: html,
    });

    console.log('🔍 Réponse Resend complète:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('❌ Erreur Resend:', data.error);
      throw new Error(`Resend Error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    console.log("✅ Email envoyé avec succès:", data.data?.id || 'success');
    return data;
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    throw error;
  }
}

// Template d'email de vérification
export function createVerificationEmailTemplate(
  url: string,
  userName?: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Vérification de votre email</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🥋 Système de Gestion Judo</h1>
                <p>Vérification de votre adresse email</p>
            </div>
            <div class="content">
                <h2>Bonjour ${userName || ""},</h2>
                <p>Merci de vous être inscrit sur notre système de gestion des présences judo.</p>
                <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
                
                <div style="text-align: center;">
                    <a href="${url}" class="button">Vérifier mon email</a>
                </div>
                
                <p>Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
                    ${url}
                </p>
                
                <p><strong>Important :</strong> Ce lien expire dans 1 heure pour des raisons de sécurité.</p>
                
                <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.</p>
            </div>
            <div class="footer">
                <p>© 2024 Système de Gestion Judo - Tous droits réservés</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
