/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as IOServer, Socket } from 'socket.io';
import { checkShouldSendNotification } from '../helper/checkShouldSendNotification';
import { getSingleConversation } from '../helper/getSingleConversation';
import { sendSinglePushNotification } from '../helper/sendPushNotification';
import { Block } from '../modules/block/block.model';
import Conversation from '../modules/conversation/conversation.model';
import Message from '../modules/message/message.model';
import NormalUser from '../modules/normalUser/normalUser.model';
import { ENUM_NOTIFICATION_TYPE } from '../modules/notification/enum.notification';
import { emitError } from './helper';

const activeChats = new Map<string, string>();

const handleChat = async (
    io: IOServer,
    socket: Socket,
    currentUserId: string
): Promise<void> => {
    // ------------------- Track chat activity -------------------
    socket.on('join-chat', (chatPartnerId: string) => {
        if (currentUserId) {
            activeChats.set(currentUserId, chatPartnerId);
            console.log(
                `User ${currentUserId} opened chat with ${chatPartnerId}`
            );
        }
    });

    socket.on('leave-chat', () => {
        if (currentUserId) {
            activeChats.delete(currentUserId);
            console.log(`User ${currentUserId} left chat`);
        }
    });

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
        if (!currentUserId) {
            emitError(socket, {
                code: 400,
                message: 'You are not connected',
                type: 'general',
                details: 'You must connected before send message',
            });
            return;
        }

        const block = await Block.findOne({
            $or: [
                { blocker: currentUserId, blocked: data.receiver },
                { blocker: data.receiver, blocked: currentUserId },
            ],
        });
        if (block) {
            if (block?.blocked.toString() == currentUserId) {
                emitError(socket, {
                    code: 400,
                    message: 'This user blocked you',
                    type: 'general',
                    details:
                        "You can't able to send message to him/her becuase he/she blocked you",
                });
                return;
            }
            if (block.blocker.toString() == currentUserId) {
                emitError(socket, {
                    code: 400,
                    message: 'You blocked this person',
                    type: 'general',
                    details:
                        "You can't able to send message to him/her becuase you blocked this person",
                });
                return;
            }
        }

        let conversation = await Conversation.findOne({
            $and: [
                { participants: currentUserId },
                { participants: data.receiver },
            ],
        });

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

        // ------------------- Notification logic -------------------
        const receiverChatPartner = activeChats.get(data.receiver);
        const receiverIsActiveInChat = receiverChatPartner === currentUserId;

        if (!receiverIsActiveInChat) {
            const shouldSend = await checkShouldSendNotification(
                data.receiver.toString(),
                ENUM_NOTIFICATION_TYPE.messageNotification
            );

            if (shouldSend) {
                // const notificationData = {
                //     title: 'New message',
                //     message: `${
                //         data.senderName || 'Someone'
                //     } sent you a message`,
                //     receiver: data.receiver.toString(),
                //     type: ENUM_NOTIFICATION_TYPE.messageNotification,
                // };

                // await Notification.create(notificationData);
                const user = await NormalUser.findById(data.receiver);
                if (!user) {
                    return;
                }
                await sendSinglePushNotification(
                    user.user.toString(),
                    'Someone sends a chat message',
                    `${user?.name || 'Someone'} sent you a new message`,
                    { conversationId: conversation._id }
                );
            }
        }
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
