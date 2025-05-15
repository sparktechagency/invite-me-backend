import { z } from 'zod';
import { ENUM_GENDER } from '../user/user.enum';

export const createNormalUserSchema = z.object({
    body: z.object({
        password: z
            .string({ required_error: 'Password is required' })
            .min(6, { message: 'Password must be 6 character' }),
        confirmPassword: z
            .string({ required_error: 'Confirm password is required' })
            .min(6, { message: 'Password must be 6 character' }),

        name: z.string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be a string',
        }),
        email: z.string().email('Invalid email format'),
        phone: z.string().optional(),
        gender: z
            .enum(Object.values(ENUM_GENDER) as [string, ...string[]])
            .optional(),
        dateOfBirth: z.string().optional(),
        country: z.string().optional(),
    }),
});
export const updateNormalUserData = z.object({
    body: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        gender: z
            .enum(Object.values(ENUM_GENDER) as [string, ...string[]])
            .optional(),
        dateOfBirth: z.string().optional(),
        country: z.string().optional(),
    }),
});

const normalUserValidations = {
    createNormalUserSchema,
    updateNormalUserData,
};

export default normalUserValidations;
