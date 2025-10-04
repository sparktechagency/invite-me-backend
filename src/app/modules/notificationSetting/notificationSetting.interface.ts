import { Types } from 'mongoose';

export interface INotificationSetting {
    user: Types.ObjectId;
    generalNotification: boolean;
    matchNotification: boolean;
    messageNotification: boolean;
}
