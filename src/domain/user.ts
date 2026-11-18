import { z } from "zod";

export const UserSchema = z.object({
	id: z.number().int(),
	username: z.string().nullable(),
	firstName: z.string(),
	lastName: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;
