import { asyncHandler } from "../utils/response.js";
import {
  decodedToken,
  tokenTypeEnum,
} from "../utils/security/token.security.js";

export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
  return asyncHandler(async (req, res, next) => {
    const {user, decoded} = await decodedToken({
      authorization: req.headers.authorization,
      next,
      tokenType,
    });
    req.user = user;
    req.decoded = decoded;
    return next();
  });
};

export const authorization = ({ accessRoles = [] } = {}) => {
  return asyncHandler(async (req, res, next) => {

    if (!req.user || !accessRoles.includes(req.user.role)) {
      const error = new Error("Not authorized account");
      error.statusCode = 403;
      return next(error);
    }

    return next();
  });
};
// export const authorization = ({ accessRoles = [] } = {}) => {
//   return asyncHandler(async (req, res, next) => {
//     req.user = await decodedToken({
//       authorization: req.headers.authorization,
//       next,
//     });

//     if (!accessRoles.includes(req.user.role)) {
//       const error = new Error("Not authorized account");
//       error.statusCode = 403;
//       return next(error);
//     }

//     return next();
//   });
// };
