/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import userServices from './user.services';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';

const registerUser = catchAsync(async (req, res) => {
    if (req.files?.pictures) {
        req.body.pictures = req.files.pictures.map((file: any) => {
            return getCloudFrontUrl(file.key);
        });
    }
    const file: any = req.files?.profile_image;
    if (req.files?.profile_image) {
        req.body.profile_image = getCloudFrontUrl(file[0].key);
    }
    const result = await userServices.registerUser(
        req.user.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Your registration is successfully completed',
        data: result,
    });
});

const getMyProfile = catchAsync(async (req, res) => {
    const clientIp =
        req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('client ip', clientIp);
    const result = await userServices.getMyProfile(req.user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Successfully retrieved your data',
        data: result,
    });
});
const changeUserStatus = catchAsync(async (req, res) => {
    const result = await userServices.changeUserStatus(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `User is ${result?.isBlocked ? 'Blocked' : 'Unblocked'}`,
        data: result,
    });
});
const deleteUserAccount = catchAsync(async (req, res) => {
    const result = await userServices.deleteUserAccount(
        req.user,
        req.body.password
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Your account deleted successfully`,
        data: result,
    });
});

const userController = {
    registerUser,
    getMyProfile,
    changeUserStatus,
    deleteUserAccount,
};
export default userController;
