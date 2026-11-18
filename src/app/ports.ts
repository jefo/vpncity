import type { Plan } from "../domain/plans";
import type { User } from "../domain/user";
import type { Subscription } from "../domain/subscription";
import type { Invoice } from "../domain/payment";
import type { VpnConfig } from "../domain/vpn-config";

export interface CityStore {
	findUser(userId: number): Promise<User | null>;
	saveUser(user: User): Promise<void>;
	findSubscriptionByUser(userId: number): Promise<Subscription | null>;
	findSubscriptionById(id: string): Promise<Subscription | null>;
	saveSubscription(subscription: Subscription): Promise<void>;
	saveInvoice(invoice: Invoice): Promise<void>;
	findInvoice(id: string): Promise<Invoice | null>;
	saveVpnConfig(config: VpnConfig): Promise<void>;
	findVpnConfig(id: string): Promise<VpnConfig | null>;
}

export interface PaymentGateway {
	createInvoice(input: {
		userId: number;
		subscriptionId: string;
		amountStars: number;
	}): Promise<Invoice>;
	markPaid(invoice: Invoice): Promise<Invoice>;
}

export interface VpnProvider {
	issue(input: {
		user: User;
		plan: Plan;
		subscription: Subscription;
	}): Promise<VpnConfig>;
	revoke(configId: string): Promise<void>;
}
