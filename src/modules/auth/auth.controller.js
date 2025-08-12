import { Router } from "express";
import { signup, login, signupWithGmail, loginWithGmail, confirmEmail, resendEmailOtp, forgetPassword, resetForgetPassword} from "./auth.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import { confirmEmailValidateSchema, loginValidateSchema, resendOtpValidateSchema, resetForgetPasswordValidateSchema, signupValidateSchema, signupWithGmailValidateSchema } from "./auth.validation.js";

const router = Router({
    caseSensitive: true,
});

router.post("/signup", validation(signupValidateSchema) , signup);
router.post("/login", validation(loginValidateSchema) , login);

// email confirmation proccess
router.patch("/confirm-email", validation(confirmEmailValidateSchema) , confirmEmail);
router.post("/resend-otp", validation(resendOtpValidateSchema) , resendEmailOtp);

// signup & login using google-provider
router.post("/signup/gmail", validation(signupWithGmailValidateSchema) ,signupWithGmail);
router.post("/login/gmail", validation(signupWithGmailValidateSchema) ,loginWithGmail);

// forget password
router.patch("/forget-password", validation(resendOtpValidateSchema) , forgetPassword)

router.patch("/reset-forget-password", validation(resetForgetPasswordValidateSchema) , resetForgetPassword)


export default router