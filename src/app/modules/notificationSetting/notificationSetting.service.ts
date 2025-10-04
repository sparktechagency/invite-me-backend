import httpStatus from "http-status";
import AppError from "../../error/appError";
import { INotificationSetting } from "./notificationSetting.interface";
import notificationSettingModel from "./notificationSetting.model";

const updateUserProfile = async (id: string, payload: Partial<INotificationSetting>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await notificationSettingModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await notificationSettingModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const NotificationSettingServices = { updateUserProfile };
export default NotificationSettingServices;