import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
} as SMTPTransport.Options);

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: '"Anonymous chat system" <no-reply@example.com>',
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
