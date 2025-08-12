import jwt from "jsonwebtoken";
import * as DBService from "../../DB/db.service.js";
import { roleEnum, UserModel } from "../../DB/models/User.model.js";
import { decryptEncryption, generateEncryption } from "./encryption.security.js";
import { nanoid } from "nanoid";
import { RevokeTokenModel } from "../../DB/models/Revoke.token.model.js";

export const signatureTypeEnum = { system: "System", bearer: "Bearer" };
export const tokenTypeEnum = { access: "access", refresh: "refresh" };

export const generateToken = async ({
  payload = {},
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
  options = {
    
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  },
} = {}) => {
  return jwt.sign(payload, signature, options);
};

export const verifyToken = async ({
  token = "",
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
} = {}) => {
  return jwt.verify(token, signature);
};

export const getSignatures = async ({
  signatureLevel = signatureTypeEnum.bearer
} = {}) => {
  let signatures = {
    accessSignature: undefined,
    refreshSignature: undefined,
  };
  switch (signatureLevel) {
    case signatureTypeEnum.system:
      signatures.accessSignature = process.env.ACCESS_TOKEN_SYSTEM_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_TOKEN_SYSTEM_SIGNATURE;
      break;
    default:
      signatures.accessSignature = process.env.ACCESS_TOKEN_USER_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_TOKEN_USER_SIGNATURE;
      break;
  }


  return signatures;
};

export const decodedToken = async ({
  authorization = "",
  tokenType = tokenTypeEnum.access,
} = {}) => {
  const [bearer, token] = authorization?.split(" ") || [];

  if (!token || !bearer) {
    const error = new Error("Missing token parts");
    error.statusCode = 401;
    throw error;
  }

  const signature = await getSignatures({ signatureLevel: bearer });

  const decoded = await verifyToken({
    token,
    signature:
      tokenType === tokenTypeEnum.access
        ? signature.accessSignature
        : signature.refreshSignature,
  });

  if(await DBService.findOne({model:RevokeTokenModel, filter:{idToken:decoded.jti}})){
    const error = new Error("user have signed out from this device");
    error.statusCode = 401;
    throw error;
  }

  const user = await DBService.findById({
    model: UserModel,
    id: decoded._id,
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  user.phone = await decryptEncryption({ ciphertext: user.phone });

  if(user.changeLoginCredenials && new Date(user.changeLoginCredenials).getTime() > decoded.iat * 1000){
    const error = new Error("Login credentials have been changed, please login again");
    error.statusCode = 401;
    throw error;
  }

  return {user, decoded};
};

export const getLoginCredentials = async ({user} = {}) => {
  const signatures = await getSignatures({
    signatureLevel: user.role != roleEnum.user ? signatureTypeEnum.system : signatureTypeEnum.bearer,
  })
  const tokenId = nanoid()
  const access_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.accessToken,
    options:{
      jwtid: tokenId,
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    }
  })

  const refresh_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.refreshSignature,
    options: {
      jwtid: tokenId,
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
    },
  });

  return {access_token,refresh_token}
}

