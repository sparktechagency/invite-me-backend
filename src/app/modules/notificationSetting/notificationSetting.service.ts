import { INotificationSetting } from './notificationSetting.interface';
import NotificationSetting from './notificationSetting.model';

const updateNotificationSetting = async (
    userId: string,
    payload: INotificationSetting
) => {
    const result = await NotificationSetting.findOneAndUpdate(
        { user: userId },
        payload,
        { new: true, runValidators: true }
    );
    return result;
};

const getNotificationSetting = async (profileId: string) => {
    const result = await NotificationSetting.findOne({ user: profileId });
    return result;
};

const notificationSettingService = {
    updateNotificationSetting,
    getNotificationSetting,
};

export default notificationSettingService;
