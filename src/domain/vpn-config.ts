import { z } from "zod";

export const VpnConfigSchema = z.object({
	id: z.string(),
	userId: z.number().int(),
	subscriptionId: z.string(),
	serverLocation: z.string(),
	status: z.enum(["active", "revoked"]),
	content: z.string(),
});

export type VpnConfig = z.infer<typeof VpnConfigSchema>;
