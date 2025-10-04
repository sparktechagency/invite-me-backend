import { model, Schema } from 'mongoose';
import { INotificationSetting } from './notificationSetting.interface';

const notificationSettingSchema = new Schema<INotificationSetting>(
    {
        user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
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

const notificationSettingModel = model<INotificationSetting>(
    'NotificationSetting',
    notificationSettingSchema
);
export default notificationSettingModel;
