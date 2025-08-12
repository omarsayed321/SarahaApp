import {roleEnum,UserModel,providerEnum,
} from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBService from "../../DB/db.service.js";
import {generateHash,compareHash,
} from "../../utils/security/hash.security.js";
import {decryptEncryption,generateEncryption,
} from "../../utils/security/encryption.security.js";
import {generateToken,getSignatures,signatureTypeEnum,
} from "../../utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { customAlphabet } from "nanoid";
import { emailEvent } from "../../utils/events/email.event.js";

// helper functions
async function verify(idToken) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_ID.split(","),
  });
  const payload = ticket.getPayload();
  return payload;
}

async function generateLoginToken(user) {
  const signature = await getSignatures({
    signatureLevel:
      user.role != roleEnum.user
        ? signatureTypeEnum.system
        : signatureTypeEnum.bearer,
  });

  const access_token = await generateToken({
    payload: { _id: user._id },
    signature: signature.accessSignature,
  });
  const refresh_token = await generateToken({
    payload: { _id: user._id },
    signature: signature.refreshSignature,
    options: {
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
    },
  });

  return { access_token, refresh_token };
}

// system authentication

export const signup = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password } = req.body;

  if (await DBService.findOne({ model: UserModel, filter: { email } })) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    return next(error);
  }

  const hashPassword = await generateHash({
    plaintext: password,
    saltRound: 12,
  });
  const encPhone = await generateEncryption({ plaintext: phone });

  const otp = customAlphabet("0123456789", 6)();
  const hashOtp = await generateHash({ plaintext: otp, saltRound: 12 });

  const [user] = await DBService.create({
    model: UserModel,
    data: [
      {
        fullName,
        email,
        password: hashPassword,
        phone: encPhone,
        confirmEmailOtp: hashOtp,
      },
    ],
  });
  emailEvent.emit("sendConfirmEmail", { email, otp });

  return successResponse({
    res,
    message: "Signup successfully",
    status: 201,
    data: { user },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await DBService.findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.system },
  });
  if (!user) {
    const error = new Error("Invalid email or password or provider");
    error.statusCode = 404;
    return next(error);
  }

  if (!user.confirmEmail) {
    const error = new Error("Email not confirmed");
    error.statusCode = 400;
    return next(error);
  }

  if (!(await compareHash({ plaintext: password, hashValue: user.password }))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 404;
    return next(error);
  }

  const data = await generateLoginToken(user);

  return successResponse({
    res,
    message: "Login successfully",
    status: 200,
    data,
  });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await DBService.findOne({
    model: UserModel,
    filter: {
      email,
      provider: providerEnum.system,
      confirmEmail: { $exists: false },
      confirmEmailOtp: { $exists: true },
    },
  });

  if (!user) {
    return next(new Error("Invalid account"));
  }

  // Check if user is banned

  const now = Date.now();

  if (
    user.confirmEmailOtpBannedUntil &&
    user.confirmEmailOtpBannedUntil > now
  ) {
    // const waitTimeInMs = user.confirmEmailOtpBannedUntil - now;
    const waitTimeInMin = Math.ceil(
      user.confirmEmailOtpBannedUntil - now / 60000
    ); // convert ms to minutes

    const error = new Error(
      `Too many failed attempts. Try again in ${waitTimeInMin} minute(s).`
    );
    error.statusCode = 429;
    return next(error);
  }
  // Check if OTP is expired
  if (!user.confirmEmailOtpExpiresAt || user.confirmEmailOtpExpiresAt < now) {
    return next(new Error("OTP expired"));
  }

  const isValidOtp = await compareHash({
    plaintext: otp,
    hashValue: user.confirmEmailOtp,
  });

  if (!isValidOtp) {
    const failedAttempts = (user.confirmEmailOtpFailedAttempts || 0) + 1;
    const updateData = {
      confirmEmailOtpFailedAttempts: failedAttempts,
    };

    // Ban user after 5 failed attempts
    if (failedAttempts >= 5) {
      updateData.confirmEmailOtpBannedUntil = new Date(now + 5 * 60 * 1000);
      updateData.confirmEmailOtpFailedAttempts = 0;

      await DBService.updateOne({
        model: UserModel,
        filter: { email },
        data: { $set: updateData },
      });
    }

    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    return next(error);
  }

  // OTP is correct — confirm email and reset all OTP-related fields
  await DBService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      $set: {
        confirmEmail: now,
      },
      $unset: {
        confirmEmailOtp: 1,
        confirmEmailOtpExpiresAt: 1,
        confirmEmailOtpFailedAttempts: 1,
        confirmEmailOtpBannedUntil: 1,
      },
    },
  });

  return successResponse({ res, status: 200 });
});

export const resendEmailOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await DBService.findOne({
    model: UserModel,
    filter: {
      email,
      provider: providerEnum.system,
      confirmEmail: { $exists: false },
    },
  });

  if (!user) {
    const error = new Error("No pending confirmation for this email");
    error.statusCode = 404;
    return next(error);
  }

  const otp = customAlphabet("0123456789", 6)();
  const hashOtp = await generateHash({ plaintext: otp, saltRound: 12 });

  await DBService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      $set: {
        confirmEmailOtp: hashOtp,
        confirmEmailOtpExpiresAt: Date.now() + 2 * 60 * 1000,
      },
      $unset: {
        confirmEmailOtpFailedAttempts: 1,
        confirmEmailOtpBannedUntil: 1,
      },
    },
  });

  emailEvent.emit("sendConfirmEmail", { email, otp });

  return successResponse({
    res,
    message: "OTP resent successfully",
    status: 200,
  });
});

// google-provider authentication

export const signupWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const { email_verified, email, picture, name } = await verify(idToken);

  if (!email_verified) {
    const error = new Error("Email not verified");
    error.statusCode = 400;
    return next(error);
  }

  if (await DBService.findOne({ model: UserModel, filter: { email } })) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    return next(error);
  }

  const newUser = await DBService.create({
    model: UserModel,
    data: [
      {
        fullName: name,
        email,
        confirmEmail: Date.now(),
        provider: providerEnum.google,
      },
    ],
  });

  return successResponse({
    res,
    data: { user: newUser },
    message: "Gmail signup successful",
    status: 201,
  });
});

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const { email_verified, email } = await verify(idToken);

  if (!email_verified) {
    const error = new Error("Email not verified");
    error.statusCode = 400;
    return next(error);
  }

  const user = await DBService.findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.google },
  });

  if (!user) {
    return next(new Error("User not found with this email or provider"));
  }

  const data = await generateLoginToken(user);

  return successResponse({
    res,
    message: "Login successfully",
    status: 200,
    data,
  });
});

// forget password

export const forgetPassword = asyncHandler(
  async (req, res, next) => {
    const { email } = req.body;
    const otp = customAlphabet("0123456789", 6)();
    const hashOtp = await generateHash({ plaintext: otp, saltRound: 12 });

    const user = await DBService.findOneAndUpdate({
      model: UserModel,
      filter: {
        email,
        freezeAt: { $exists: false },
        confirmEmail: { $exists: true },
      },
     data:{
        forgetCode: hashOtp,
      }
    });

    if(!user) {
      const error = new Error("User not found or email not confirmed");
      error.statusCode = 404;
      return next(error);
    }
    emailEvent.emit("forgetPassword", { email, otp});

    return successResponse({
      res,
      message: "Forget password code sent successfully",
      status: 200,
    });
  
  }
);

export const resetForgetPassword = asyncHandler(
  async (req, res, next) => {
    const { email, otp, password } = req.body;
    const user = await DBService.findOneAndUpdate({
      model: UserModel,
      filter: {
        email,
        freezeAt: { $exists: false },
        confirmEmail: { $exists: true },
      }
    });

    if(!user) {
      const error = new Error("User not found or email not confirmed");
      error.statusCode = 404;
      return next(error);
    }
    if(!await compareHash({ plaintext: otp, hashValue: user.forgetCode })) {
      return next(new Error("Invalid OTP"));
    }
    const hashPassword = await generateHash({
      plaintext: password,
    });

    await DBService.updateOne({
      model:UserModel,
      filter:{email},
      data:{
        $set:{password:hashPassword, changeLoginCredenials:Date.now()},
        $unset:{forgetCode:1},
        $inc:{__v:1}
      }
    })
    

    return successResponse({
      res,
      message: "password reset successfully",
      status: 200,
      data:{user}
    });
  
  }
);
