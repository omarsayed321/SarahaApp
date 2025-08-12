import { asyncHandler, successResponse } from "../../utils/response.js";
import { getLoginCredentials } from "../../utils/security/token.security.js";
import * as DBService from "../../DB/db.service.js";
import { roleEnum, UserModel } from "../../DB/models/User.model.js";
import { generateEncryption } from "../../utils/security/encryption.security.js";
import {compareHash,generateHash,} from "../../utils/security/hash.security.js";
import { RevokeTokenModel } from "../../DB/models/Revoke.token.model.js";
import { nanoid } from "nanoid";
import { cloud, deleteFoulderByPrefix, deleteResources, destroyFile, uploadFile, uploadFiles } from "../../utils/multer/cloudinary.js";

export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await DBService.findById({
    model: UserModel,
    id:req.user._id,
    populate: [{ path: "messages" }]
  })
  return successResponse({
    res,
    message: "Profile retrieved successfully",
    status: 200,
    data: { user },
  });
});

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {
  const credentials = await getLoginCredentials({ user: req.user });
  return successResponse({ res, data: { credentials } });
});

export const shareProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await DBService.findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "-password -role",
  });

  return user
    ? successResponse({
        res,
        message: "Profile retrieved successfully",
        status: 200,
        data: { user },
      })
    : next(new Error("User not found", { cause: 404 }));
});

export const updateBasicProfile = asyncHandler(async (req, res, next) => {
  if (req.body.phone) {
    req.body.phone = await generateEncryption({ plaintext: req.body.phone });
  }
  const user = await DBService.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: {
      $set: req.body,
      $inc: { __v: 1 },
    },
  });

  return user
    ? successResponse({
        res,
        message: "Profile updated successfully",
        status: 200,
        data: { user },
      })
    : next(new Error("not registered account", { cause: 404 }));
});

export const uploadProfileImage = asyncHandler(async (req, res, next) => {
  const {secure_url, public_id} = await uploadFile({file: req.file, path: `user/${req.user._id}`})
  const user = await DBService.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: { picture:{secure_url, public_id} },
    options: { new: false },
  });
  if(user?.picture?.public_id){
    await destroyFile({public_id: user.picture.public_id});
  }
  return successResponse({
    res,
    data:{user},
    message: "image uploaded successfully",
  });
});

export const uploadManyFiles = asyncHandler(async (req, res, next) => {
  const attachments = await uploadFiles({files: req.files, path: `user/${req.user._id}/files`})

  const user = await DBService.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: { files: attachments },
    options: { new: false },
  });
  if(user?.files?.length){
    await deleteResources({
      public_ids: user.files.map(ele => ele.public_id)
    });
  }
  return successResponse({
    res,
    data:{user},
    message: "files uploaded successfully",
  });
});

export const freezeAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(
      new Error("You are not authorized to freeze this account", { cause: 403 })
    );
  }

  const user = await DBService.updateOne({
    model: UserModel,
    filter: {
      _id: userId || req.user._id,
      freezedAt: { $exists: false },
    },
    data: {
      $set: {
        freezedAt: new Date(),
        freezedBy: req.user._id,
      },
      $inc: { __v: 1 },
    },
  });

  return user.matchedCount
    ? successResponse({
        res,
        message: "Profile freezed successfully",
        data: { user },
      })
    : next(new Error("profile is already freezed", { cause: 404 }));
});

export const restoreAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(
      new Error("You are not authorized to restore this account", {
        cause: 403,
      })
    );
  }

  const user = await DBService.updateOne({
    model: UserModel,
    filter: {
      _id: userId || req.user._id,
      freezedAt: { $exists: true },
    },
    data: {
      $set: {
        restoredAt: new Date(),
        restoredBy: req.user._id,
      },
      $unset: {
        freezedAt: 1,
        freezedBy: 1,
      },
      $inc: { __v: 1 },
    },
  });

  return user.matchedCount
    ? successResponse({
        res,
        message: "Profile restored successfully",
        data: { user },
      })
    : next(new Error("profile is not freezed", { cause: 404 }));
});

export const hardDeleteAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(
      new Error("You are not authorized to delete this account", { cause: 403 })
    );
  }

  const user = await DBService.deleteOne({
    model: UserModel,
    filter: {
      _id: userId || req.user._id,
      freezedAt: { $exists: true },
    },
  });
  if (user.deletedCount) {
    await deleteFoulderByPrefix({prefix: `user/${userId}`})
  }

  return user.deletedCount
    ? successResponse({
        res,
        message: "Profile deleted successfully",
        data: { user },
      })
    : next(new Error("profile must be freezed first", { cause: 404 }));
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, password } = req.body;
  if (
    !(await compareHash({
      plaintext: oldPassword,
      hashValue: req.user.password,
    }))
  ) {
    return next(new Error("Invalid-old password", { cause: 400 }));
  }

  const hashPassword = await generateHash({ plaintext: password });

  const user = await DBService.updateOne({
    model: UserModel,
    filter: {
      _id: req.user._id,
    },
    data: {
      $set: { password: hashPassword, changeLoginCredenials: Date.now() },
      $inc: { __v: 1 },
    },
  });

  return user.matchedCount
    ? successResponse({
        res,
        message: "password updated successfully",
        data: { user },
      })
    : next(new Error("not registered account", { cause: 404 }));
});

export const logout = asyncHandler(async (req, res, next) => {
  const idToken = nanoid();
  await DBService.create({
    model: RevokeTokenModel,
    data: [
      {
        idToken,
        expiresAccessDate: req.decoded.exp,
        expiresRefreshDate: req.decoded.iat + 3156000,
      },
    ],
  });
  return successResponse({ res, data: {} });
});
