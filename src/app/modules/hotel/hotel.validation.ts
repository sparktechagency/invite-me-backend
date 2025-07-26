import { z } from 'zod';

export const createHotelZodSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: 'Name is required' })
            .min(1, 'Hotel name is required'),
        location: z
            .string({ required_error: 'Location is required' })
            .min(1, 'Location is required'),
        wifiIp: z.string({ required_error: 'Wifi ip is required' }),
    }),
});

export const updateHotelZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        location: z.string().optional(),
        wifiIp: z.string().optional(),
    }),
});

const HotelValidations = {
    createHotelZodSchema,
    updateHotelZodSchema,
};

export default HotelValidations;
