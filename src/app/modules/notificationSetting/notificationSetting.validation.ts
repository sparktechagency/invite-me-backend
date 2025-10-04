import { z } from "zod";

export const updateNotificationSettingData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const NotificationSettingValidations = { updateNotificationSettingData };
export default NotificationSettingValidations;