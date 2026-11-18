import { z } from "zod";

export const PlanSchema = z.object({
	id: z.string(),
	name: z.string(),
	priceStars: z.number().int().positive(),
	durationDays: z.number().int().positive(),
	description: z.string(),
});

export type Plan = z.infer<typeof PlanSchema>;

export const PLANS: Plan[] = [
	{
		id: "1m",
		name: "1 месяц",
		priceStars: 50,
		durationDays: 30,
		description: "Одно устройство, 100 ГБ",
	},
	{
		id: "6m",
		name: "6 месяцев",
		priceStars: 250,
		durationDays: 180,
		description: "До трёх устройств, 500 ГБ в месяц",
	},
	{
		id: "1y",
		name: "1 год",
		priceStars: 450,
		durationDays: 365,
		description: "До пяти устройств, без лимита трафика",
	},
];

export const findPlan = (planId: string): Plan | null =>
	PLANS.find((plan) => plan.id === planId) ?? null;
