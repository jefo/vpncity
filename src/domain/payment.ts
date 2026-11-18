import { z } from "zod";

export const InvoiceSchema = z.object({
	id: z.string(),
	userId: z.number().int(),
	subscriptionId: z.string(),
	amountStars: z.number().int().positive(),
	status: z.enum(["pending", "completed"]),
	paymentUrl: z.string(),
	createdAt: z.date(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
