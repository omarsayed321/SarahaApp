import  joi  from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';
import { genderEnum } from './../../DB/models/User.model.js';
import { fileValidation } from '../../utils/multer/cloud.multer.js';

export const shareProfileSchema = {
    params: joi.object().keys({
        userId: generalFields.userId.required()
    }).required()
}

export const updateBasicProfileSchema = {
    params: joi.object().keys({
        firstName: generalFields.fullName,
        lastName: generalFields.fullName,
        phone: generalFields.phone,
        gender: joi.string().valid(...Object.values(genderEnum))
    }).required()
}

export const freezeAccountSchema = {
    params: joi.object().keys({
        userId: generalFields.userId
    }).required()
}

export const updatePasswordSchema = {
    body: joi.object().keys({
        oldPassword: generalFields.password.required(),
        password: generalFields.password.not(joi.ref("oldPassword")).required(),
        confirmPassword: generalFields.confirmPassword.required(),
    }).required()
}

export const uploadImage = {
    file: joi.object().keys({
        fieldname: joi.string().valid("attachment").required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().valid(...fileValidation.image).required(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().positive().required(),
    }).required()
}

export const uploadFiles = {
  files: joi.array().items(
    joi.object({
      fieldname: joi.string().valid("attachments").required(),
      originalname: joi.string().required(),
      encoding: joi.string().required(),
      mimetype: joi.string().valid(...fileValidation.image).required(),
      destination: joi.string().required(),
      filename: joi.string().required(),
      path: joi.string().required(),
      size: joi.number().positive().required()
    })
  ).min(1).required()
}
