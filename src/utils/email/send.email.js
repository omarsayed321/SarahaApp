import nodemailer from "nodemailer";

export async function sendEmail({
    from=process.env.APP_EMAIL,
    to=[],
    cc=[],
    bcc=[],
    subject="ROUTE",
    text="",
    html="",
    attachments=[],
} = {}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `ROUTE <${from}>`,
    to,
    cc,
    bcc,
    text,
    html,
    attachments,
    subject,
  });
  console.log("Message sent: ", info.messageId);
}
