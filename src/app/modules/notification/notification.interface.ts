import { ENUM_NOTIFICATION_TYPE } from './enum.notification';

export interface INotification {
    title: string;
    message: string;
    receiver: string;
    type: (typeof ENUM_NOTIFICATION_TYPE)[keyof typeof ENUM_NOTIFICATION_TYPE];
    deleteBy?: string[];
    seenBy?: string[];
}
