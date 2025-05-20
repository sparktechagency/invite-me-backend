import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import connectionServices from './connection.service';

const addRemoveConnection = catchAsync(async (req, res) => {
    const result = await connectionServices.connectionAddRemove(
        req.user.profileId,
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result?.message,
        data: result?.result,
    });
});
const accpetRejectConnectionRequest = catchAsync(async (req, res) => {
    const result = await connectionServices.acceptRejectConnectionRequest(
        req.user.profileId,
        req.params.id,
        req.query.status as string
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result?.message,
        data: result?.result,
    });
});
const getAllConnectionRequest = catchAsync(async (req, res) => {
    const result = await connectionServices.getAllConnectionRequest(
        req.user.profileId,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connection requests retrieved successfully',
        data: result,
    });
});
const getMyConnections = catchAsync(async (req, res) => {
    const result = await connectionServices.getMyConnections(
        req.user.profileId,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connection  retrieved successfully',
        data: result,
    });
});

const ConnectionController = {
    addRemoveConnection,
    accpetRejectConnectionRequest,
    getAllConnectionRequest,
    getMyConnections,
};
export default ConnectionController;
