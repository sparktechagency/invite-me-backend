import { z } from 'zod';

const createConnectionValidationSchema = z.object({
    body: z.object({
        sender: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
        receiver: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
    }),
});

const ConnectionValidations = { createConnectionValidationSchema };
export default ConnectionValidations;
