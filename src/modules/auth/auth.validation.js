import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const signupValidateSchema = {
  body: joi.object().keys({
      fullName: generalFields.fullName.required(),
      email: generalFields.email.required(),
      password: generalFields.password.required(),
      confirmPassword: generalFields.confirmPassword.required(),
      phone: generalFields.phone.required(),
    }).required(),

  query: joi.object().keys({
      lang: joi.string().valid("en", "ar").default("en"),
    }).optional(),
};

export const loginValidateSchema = {
  body: joi.object().keys({
    email: generalFields.email.required(),
    password: generalFields.password.required(),
  }).required(),
}

export const confirmEmailValidateSchema = {
  body: joi.object().keys({
    email: generalFields.email.required(),
    otp: generalFields.otp.required(),
  }).required(),
}

export const resendOtpValidateSchema = {
  body: joi.object().keys({
    email: generalFields.email.required(),
  }).required(),
}

export const signupWithGmailValidateSchema = {
  body: joi.object().keys({
    idToken: generalFields.idToken.required(),
  }).required(),
}

export const resetForgetPasswordValidateSchema = {
  body: joi.object().keys({
    email: generalFields.email.required(),
    otp: generalFields.otp.required(),
    password: generalFields.password.required(),
    confirmPassword: generalFields.confirmPassword.required(),
  }).required(),
}

