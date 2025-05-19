import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import MessageService from './message.service';

const getMessages = catchAsync(async (req, res) => {
  const result = await MessageService.getMessages(
    req?.user?.id,
    req.body,
    req.query,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

const MessageController = {
  getMessages,
};

export default MessageController;
