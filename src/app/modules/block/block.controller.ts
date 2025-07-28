import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import BlockServices from './block.service';

const blockUnblockUser = catchAsync(async (req, res) => {
    const result = await BlockServices.blockUnblockUser(
        req.user.profileId,
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result.result,
    });
});

const BlockController = { blockUnblockUser };
export default BlockController;
