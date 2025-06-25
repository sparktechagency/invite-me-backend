/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as IOServer, Socket } from 'socket.io';
import Conversation from '../modules/conversation/conversation.model';
import Message from '../modules/message/message.model';
import { emitError } from './helper';
import { getSingleConversation } from '../helper/getSingleConversation';

const handleChat = async (
    io: IOServer,
    socket: Socket,
    currentUserId: string
): Promise<void> => {
    // new message -----------------------
    socket.on('send-message', async (data) => {
        if (!data.receiver) {
            emitError(socket, {
                code: 400,
                message: 'Receiver or project id required',
                type: 'general',
                details: 'You must provide receiverId',
            });
            return;
        }

        let conversation = await Conversation.findOne({
            $and: [
                { participants: currentUserId },
                { participants: data.receiver },
            ],
        });
        console.log('conversation', conversation);

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, data.receiver],
            });
        }
        const messageData = {
            text: data.text,
            imageUrl: data.imageUrl || [],
            videoUrl: data.videoUrl || [],
            // msgByUserId: data?.sender,
            msgByUserId: currentUserId,
            conversationId: conversation?._id,
        };
        const saveMessage = await Message.create(messageData);
        await Conversation.updateOne(
            { _id: conversation?._id },
            {
                lastMessage: saveMessage._id,
            }
        );
        // send to the frontend only new message data ---------------
        io.to(currentUserId.toString()).emit(
            `message-${data?.currentUserId}`,
            saveMessage
        );
        io.to(data?.receiver.toString()).emit(
            `message-${data?.receiver}`,
            saveMessage
        );
        //send conversation
        const conversationSender = await getSingleConversation(
            conversation._id,
            currentUserId
        );
        const conversationReceiver = await getSingleConversation(
            conversation._id,
            data?.receiver
        );

        io.to(currentUserId.toString()).emit(
            'conversation',
            conversationSender
        );
        io.to(data?.receiver).emit('conversation', conversationReceiver);
    });

    // send---------------------------------
    socket.on('seen', async ({ conversationId, msgByUserId }) => {
        await Message.updateMany(
            { conversationId: conversationId, msgByUserId: msgByUserId },
            { $set: { seen: true } }
        );
        //send conversation --------------
        const conversationSender = await getSingleConversation(
            conversationId,
            currentUserId
        );
        const conversationReceiver = await getSingleConversation(
            conversationId,
            msgByUserId
        );

        io.to(currentUserId as string).emit('conversation', conversationSender);
        io.to(msgByUserId).emit('conversation', conversationReceiver);
    });
};

export default handleChat;
