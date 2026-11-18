import { z } from "zod";
import type { Plan } from "./plans";

export const SubscriptionStatusSchema = z.enum(["pending", "active", "expired"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
	id: z.string(),
	userId: z.number().int(),
	planId: z.string(),
	startDate: z.date(),
	endDate: z.date(),
	status: SubscriptionStatusSchema,
	vpnConfigId: z.string().nullable(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export const createPendingSubscription = (
	userId: number,
	plan: Plan,
	now = new Date(),
): Subscription => ({
	id: `sub_${userId}_${now.getTime()}`,
	userId,
	planId: plan.id,
	startDate: now,
	endDate: new Date(now.getTime() + plan.durationDays * 86_400_000),
	status: "pending",
	vpnConfigId: null,
});

export const activateForPlan = (
	subscription: Subscription,
	plan: Plan,
	now = new Date(),
): Subscription => ({
	...subscription,
	status: "active",
	startDate: now,
	endDate: new Date(now.getTime() + plan.durationDays * 86_400_000),
});

export const expireSubscription = (
	subscription: Subscription,
): Subscription => ({ ...subscription, status: "expired" });

export const daysLeft = (
	subscription: Subscription,
	now = new Date(),
): number =>
	Math.max(
		0,
		Math.ceil((subscription.endDate.getTime() - now.getTime()) / 86_400_000),
	);
