import { roleEnum } from "../../DB/models/User.model.js";

export const endPoint = {
    profile: [roleEnum.user, roleEnum.admin],
}