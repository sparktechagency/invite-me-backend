/* eslint-disable @typescript-eslint/no-explicit-any */
import Connection from '../modules/connection/connection.model';

export const calculateActiveStats = async (onlineUserIds: any) => {
    const totalActiveUser = onlineUserIds.length;

    const totalActiveConnection = await Connection.countDocuments({
        status: 'ACCEPTED',
        sender: { $in: onlineUserIds },
        receiver: { $in: onlineUserIds },
    });

    return { totalActiveUser, totalActiveConnection };
};
