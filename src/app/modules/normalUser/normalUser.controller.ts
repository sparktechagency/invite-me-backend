/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import NormalUserServices from './normalUser.services';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';

const updateUserProfile = catchAsync(async (req, res) => {
    if (req.files?.pictures) {
        req.body.newPictures = req.files.pictures.map((file: any) => {
            return getCloudFrontUrl(file.key);
        });
    }
    const file: any = req.files?.profile_image;
    if (req.files?.profile_image) {
        req.body.profile_image = getCloudFrontUrl(file[0].key);
    }
    const result = await NormalUserServices.updateUserProfile(
        req?.user?.profileId,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});

const getAllUser = catchAsync(async (req, res) => {
    const result = await NormalUserServices.getAllUser(req.user, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User retrieved successfully',
        data: result,
    });
});

const getSingleUser = catchAsync(async (req, res) => {
    const result = await NormalUserServices.getSingleUser(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User retrieved successfully',
        data: result,
    });
});
const connectionAddRemove = catchAsync(async (req, res) => {
    const result = await NormalUserServices.connectionAddRemove(
        req.user.profileId,
        req.params.id
    );
    let message;
    if (result == 1) {
        message = 'Connection request sent successfully';
    } else if (result == 2) {
        message = 'Connection removed successfully';
    } else {
        message = 'Connection request withdraw';
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: message,
        data: result,
    });
});
const acceptRejectConnectionRequest = catchAsync(async (req, res) => {
    const result = await NormalUserServices.acceptRejectConnectionRequest(
        req.user.profileId,
        req.params.id,
        req.query.status as string
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message:
            req.query.status == 'accpet'
                ? 'Connection request accepted'
                : 'Connection request rejected',
        data: result,
    });
});
const blockUnblockUser = catchAsync(async (req, res) => {
    const result = await NormalUserServices.blockUnblockUser(
        req.user.profileId,
        req.params.id
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message:
            result == 1
                ? 'User blocked successfully'
                : 'User unblocked successfully',
        data: result,
    });
});

const NormalUserController = {
    updateUserProfile,
    getAllUser,
    getSingleUser,
    connectionAddRemove,
    acceptRejectConnectionRequest,
    blockUnblockUser,
};

export default NormalUserController;
