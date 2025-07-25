/* eslint-disable @typescript-eslint/no-explicit-any */
import Conversation from '../conversation/conversation.model';
import Message from './message.model';
import QueryBuilder from '../../builder/QueryBuilder';
import NormalUser from '../normalUser/normalUser.model';

const getMessages = async (
    profileId: string,
    userId: string,
    query: Record<string, unknown>
) => {
    const conversation = await Conversation.findOne({
        $and: [{ participants: profileId }, { participants: userId }],
    });

    if (conversation) {
        const messageQuery = new QueryBuilder(
            Message.find({ conversationId: conversation?._id }).populate({
                path: 'msgByUserId',
                select: 'name profile_image',
            }),
            query
        )
            .search(['text'])
            .fields()
            .filter()
            .paginate()
            .sort();
        const result = await messageQuery.modelQuery;
        const meta = await messageQuery.countTotal();

        const userData =
            await NormalUser.findById(userId).select('name profile_image');
        return {
            meta,
            result: {
                conversationId: conversation._id,
                info: userData,
                messages: result,
            },
        };
    }
    const userData =
        await NormalUser.findById(userId).select('name profile_image');

    return {
        result: {
            conversationId: null,
            info: userData,
            messages: [],
        },
    };
};

const MessageService = {
    getMessages,
};

export default MessageService;
