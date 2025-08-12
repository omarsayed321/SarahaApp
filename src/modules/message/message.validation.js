import joi from "joi";
import { generalFields } from "./../../middleware/validation.middleware.js";
import { fileValidation } from "./../../utils/multer/cloud.multer.js";

export const sendMessageValidation = {
  params: joi.object().keys({ 
        receiverId: generalFields.userId.required() 
    }).required(),

  body: joi.object().keys({ 
        content: joi.string().min(2).max(200000) 
    }).required(),

  files: joi.array().items(
      joi.object().keys({
          fieldname: joi.string().valid("attachments").required(),
          originalname: joi.string().required(),
          encoding: joi.string().required(),
          mimetype: joi.string().valid(...fileValidation.image).required(),
          destination: joi.string().required(),
          filename: joi.string().required(),
          path: joi.string().required(),
          size: joi.number().positive().required(),
        })

    ).min(0).max(2),
};
