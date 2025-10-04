import { model, Schema } from 'mongoose';
import { INotificationSetting } from './notificationSetting.interface';

const notificationSettingSchema = new Schema<INotificationSetting>(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'NormalUser',
        },
        generalNotification: {
            type: Boolean,
            default: true,
        },
        matchNotification: {
            type: Boolean,
            default: true,
        },
        messageNotification: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const NotificationSetting = model<INotificationSetting>(
    'NotificationSetting',
    notificationSettingSchema
);
export default NotificationSetting;
