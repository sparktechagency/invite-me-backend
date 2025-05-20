import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IConnection } from "./connection.interface";
import connectionModel from "./connection.model";

const updateUserProfile = async (id: string, payload: Partial<IConnection>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await connectionModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await connectionModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const ConnectionServices = { updateUserProfile };
export default ConnectionServices;