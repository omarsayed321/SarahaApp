import {Router} from "express"
import { authentication, authorization } from "../../middleware/auth.middleware.js";
import { endPoint } from "./user.authorization.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { getProfile, getNewLoginCredentials, shareProfile, updateBasicProfile, freezeAccount, restoreAccount, hardDeleteAccount, updatePassword, logout, uploadProfileImage, uploadManyFiles } from "./user.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import { updateBasicProfileSchema, shareProfileSchema, freezeAccountSchema, updatePasswordSchema, uploadImage, uploadFiles } from "./user.validation.js";
import { fileValidation, cloudFileUpload } from "../../utils/multer/cloud.multer.js";

const router = Router({
    caseSensitive: true,
})

router.get('/', authentication(), authorization({accessRoles:endPoint.profile}) ,getProfile);

router.get('/:userId/profile', validation(shareProfileSchema) ,shareProfile);

router.patch('/upload-image', authentication(), cloudFileUpload({validation: fileValidation.image}).single("attachment") ,
validation(uploadImage),
uploadProfileImage);

router.patch('/upload-files', authentication(), cloudFileUpload({validation: fileValidation.image}).array('attachments'),
validation(uploadFiles),
uploadManyFiles);

router.get('/refresh-token', authentication({tokenType: tokenTypeEnum.refresh}) ,getNewLoginCredentials);

router.patch('/', authentication(), validation(updateBasicProfileSchema) ,updateBasicProfile);

router.delete('{/:userId}/freeze', authentication(), validation(freezeAccountSchema) ,freezeAccount);

router.patch('{/:userId}/restore', authentication(), validation(freezeAccountSchema) ,restoreAccount);

router.delete('{/:userId}/hard-delete', authentication(), validation(freezeAccountSchema) ,hardDeleteAccount);

router.patch('/update-password', authentication(), validation(updatePasswordSchema) ,updatePassword);

router.post('/logout', authentication(),logout);



export default router