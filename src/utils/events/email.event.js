import EventEmitter from "node:events";
import { sendEmail } from "../email/send.email.js";
import { emailTemplate } from "../email/email.template.js";

export const emailEvent = new EventEmitter();

emailEvent.on("sendConfirmEmail", async ({ email, subject = "Confirm-Email", otp } = {}) => {
  const html = await emailTemplate({ otp,title: "confirmation code" });

  await sendEmail({
    to: email,
    subject,
    html,
  });
});

emailEvent.on("forgetPassword", async ({ email, subject = "forget-password", otp } = {}) => {
  const html = await emailTemplate({ otp, title:"reset password code" });

  await sendEmail({
    to: email,
    subject,
    html,
  });
});
