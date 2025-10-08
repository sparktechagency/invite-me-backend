import mongoose from 'mongoose';
import Connection from '../modules/connection/connection.model';
import Conversation from '../modules/conversation/conversation.model';
import { getIO } from '../socket/socketManager';

const sendNotificationCount = async (userId: string) => {
    const io = getIO();
    const pendingConnection = await Connection.countDocuments({
        receiver: userId,
    });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Conversation.aggregate([
        { $match: { participants: userObjectId } },

        {
            $lookup: {
                from: 'messages',
                localField: '_id',
                foreignField: 'conversationId',
                as: 'messages',
            },
        },

        {
            $match: {
                messages: {
                    $elemMatch: {
                        seen: false,
                        msgByUserId: { $ne: userObjectId },
                    },
                },
            },
        },

        {
            $count: 'totalUnreadConversations',
        },
    ]);

    const totalUnreadConversations = result[0]?.totalUnreadConversations || 0;
    io.to(userId.toString()).emit(
        'notificationCount',
        totalUnreadConversations + pendingConnection
    );
};

export default sendNotificationCount;
