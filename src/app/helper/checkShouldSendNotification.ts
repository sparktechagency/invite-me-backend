import { ENUM_NOTIFICATION_TYPE } from '../modules/notification/enum.notification';
import NotificationSetting from '../modules/notificationSetting/notificationSetting.model';

export const checkShouldSendNotification = async (
    userId: string,
    notificationType: string
): Promise<boolean> => {
    const setting = await NotificationSetting.findOne({ user: userId });

    // If no setting exists, assume all notifications are enabled by default
    if (!setting) return true;

    switch (notificationType) {
        case ENUM_NOTIFICATION_TYPE.generalNotification:
            return setting.generalNotification;

        case ENUM_NOTIFICATION_TYPE.messageNotification:
            return setting.messageNotification;

        case ENUM_NOTIFICATION_TYPE.matchNotification:
            return setting.matchNotification;

        default:
            // Unknown type — don't send just to be safe
            return false;
    }
};
