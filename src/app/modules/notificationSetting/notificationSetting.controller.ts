import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import notificationSettingService from './notificationSetting.service';

const updateNotificationSetting = catchAsync(async (req, res) => {
    const result = await notificationSettingService.updateNotificationSetting(
        req?.user.profileId,
        req.body
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Notification setting updated successfully',
        data: result,
    });
});

const notificationSettingController = {
    updateNotificationSetting,
};

export default notificationSettingController;
