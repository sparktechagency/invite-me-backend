import { model, Schema } from "mongoose";
import { INotificationSetting } from "./notificationSetting.interface";

const notificationSettingSchema = new Schema<INotificationSetting>({
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true, unique: true },
    address: { type: String },
    profile_image: { type: String, default: "" },
    totalAmount: { type: Number, default: 0 },
    totalPoint: { type: Number, default: 0 }
}, { timestamps: true });

const notificationSettingModel = model<INotificationSetting>("NotificationSetting", notificationSettingSchema);
export default notificationSettingModel;