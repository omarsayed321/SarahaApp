import joi from "joi";
import {Types} from 'mongoose'
import { asyncHandler } from "./../utils/response.js";

export const generalFields = {
  fullName: joi.string().min(4).max(20),
  email: joi.string().email({
    minDomainSegments: 2,
    maxDomainSegments: 3,
    tlds: { allow: ["com", "net"] },
  }),
  password: joi
    .string()
    .pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[a-zA-Z]).{8,}$/)),
  confirmPassword: joi.string().valid(joi.ref("password")),
  phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
  otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
  idToken: joi.string().token(),
  userId: joi.string().custom((value, helper) => {
    return Types.ObjectId.isValid(value)
      ? true
      : helper.message("Invalid userId");
  }),
};

export const validation = (schema) => {
  return asyncHandler(async (req, res, next) => {
    const validationErrors = [];
    for (const key of Object.keys(schema)) {
      const validationResult = schema[key].validate(req[key], {
        abortEarly: false,
      });
      if (validationResult.error) {
        validationErrors.push(validationResult.error.details);
      }
      if (validationErrors.length) {
        return res
          .status(400)
          .json({ err_message: "Validation failed", error: validationErrors });
      }
    }
    return next();
  });
};
