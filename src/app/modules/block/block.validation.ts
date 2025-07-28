import { z } from "zod";

export const updateBlockData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const BlockValidations = { updateBlockData };
export default BlockValidations;