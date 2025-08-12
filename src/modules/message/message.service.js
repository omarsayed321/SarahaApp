import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBService from "../../DB/db.service.js"
import { UserModel } from "../../DB/models/User.model.js";
import { uploadFiles } from './../../utils/multer/cloudinary.js';
import { MessageModel } from "../../DB/models/Message.model.js";


export const sendMessage = asyncHandler(
    async(req,res,next) => {
        if(!req.body.content && !req.files){
            return next(new Error("Content or attachments are required", {cause: 400}))
        }

        const {receiverId} = req.params;
        if(!await DBService.findOne({
            model:UserModel,
            filter: {
                _id: receiverId,
                deletedAt: {$exists: false},
                confirmEmail: {$exists: true},
            }
        })){
            return next(new Errir("In-valid recidient account", {cause:404}))
        }

        const { content } = req.body;
        let attachments = [];
        if(req.files){
            attachments = await uploadFiles({files:req.files, path:`messages/${receiverId}`})
        }

        const [message] = await DBService.create({
            model:MessageModel,
            data:[{
                content,
                attachments,
                receiverId,
                senderId: req.user?._id
            }]
        })

        return successResponse({res, status: 201, data: message, message: "Message sent successfully"})
    }
)