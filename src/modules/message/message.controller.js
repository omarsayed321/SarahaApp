import {Router} from "express"
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer.js";
import { sendMessage } from "./message.service.js";
import { sendMessageValidation } from "./message.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from './../../middleware/auth.middleware.js';
const router = Router({
    caseSensitive: true,
});

router.post("/:receiverId", cloudFileUpload({validation: fileValidation.image}).array("attachments", 2),validation(sendMessageValidation),sendMessage)

router.post("/:receiverId/sender", authentication() ,cloudFileUpload({validation: fileValidation.image}).array("attachments", 2),validation(sendMessageValidation),sendMessage)



export default router;