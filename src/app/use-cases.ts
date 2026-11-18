import type { CityStore, PaymentGateway, VpnProvider } from "./ports";
import type { Plan } from "../domain/plans";
import { findPlan, PLANS } from "../domain/plans";
import type { User } from "../domain/user";
import {
	activateForPlan,
	createPendingSubscription,
	daysLeft,
	expireSubscription,
	type Subscription,
} from "../domain/subscription";
import type { Invoice } from "../domain/payment";
import type { VpnConfig } from "../domain/vpn-config";

export const getPlans = (): Plan[] => PLANS;

const ensureUser = async (
	store: CityStore,
	userId: number,
	profile?: { username?: string | null; firstName?: string; lastName?: string | null },
): Promise<User> => {
	const existing = await store.findUser(userId);
	if (existing) return existing;

	const user: User = {
		id: userId,
		username: profile?.username ?? null,
		firstName: profile?.firstName ?? "Guest",
		lastName: profile?.lastName ?? null,
	};
	await store.saveUser(user);
	return user;
};

export const buySubscription = async (
	input: {
		userId: number;
		planId: string;
		profile?: { username?: string | null; firstName?: string; lastName?: string | null };
	},
	deps: { store: CityStore; payment: PaymentGateway },
): Promise<{ user: User; plan: Plan; subscription: Subscription; invoice: Invoice }> => {
	const plan = findPlan(input.planId);
	if (!plan) throw new Error("Plan not found");

	const user = await ensureUser(deps.store, input.userId, input.profile);
	const subscription = createPendingSubscription(user.id, plan);
	await deps.store.saveSubscription(subscription);

	const invoice = await deps.payment.createInvoice({
		userId: user.id,
		subscriptionId: subscription.id,
		amountStars: plan.priceStars,
	});
	await deps.store.saveInvoice(invoice);

	return { user, plan, subscription, invoice };
};

export const confirmPayment = async (
	invoiceId: string,
	deps: { store: CityStore; payment: PaymentGateway; vpn: VpnProvider },
): Promise<{ subscription: Subscription; plan: Plan; config: VpnConfig }> => {
	const invoice = await deps.store.findInvoice(invoiceId);
	if (!invoice) throw new Error("Invoice not found");
	if (invoice.status === "completed") throw new Error("Invoice already paid");

	const subscription = await deps.store.findSubscriptionById(invoice.subscriptionId);
	if (!subscription) throw new Error("Subscription not found");

	const plan = findPlan(subscription.planId);
	if (!plan) throw new Error("Plan not found");

	const paidInvoice = await deps.payment.markPaid(invoice);
	await deps.store.saveInvoice(paidInvoice);

	const user = await deps.store.findUser(invoice.userId);
	if (!user) throw new Error("User not found");

	const active = activateForPlan(subscription, plan);
	const config = await deps.vpn.issue({ user, plan, subscription: active });
	active.vpnConfigId = config.id;

	await deps.store.saveSubscription(active);
	await deps.store.saveVpnConfig(config);

	return { subscription: active, plan, config };
};

export const getStatus = async (
	userId: number,
	deps: { store: CityStore },
): Promise<{
	user: User | null;
	subscription: Subscription | null;
	plan: Plan | null;
	config: VpnConfig | null;
	daysLeft: number;
}> => {
	const user = await deps.store.findUser(userId);
	const subscription = await deps.store.findSubscriptionByUser(userId);

	if (!user || !subscription) {
		return { user, subscription: null, plan: null, config: null, daysLeft: 0 };
	}

	const plan = findPlan(subscription.planId);
	const effective =
		subscription.status === "active" && subscription.endDate < new Date()
			? expireSubscription(subscription)
			: subscription;

	const config = effective.vpnConfigId
		? await deps.store.findVpnConfig(effective.vpnConfigId)
		: null;

	return {
		user,
		subscription: effective,
		plan,
		config,
		daysLeft: daysLeft(effective),
	};
};
