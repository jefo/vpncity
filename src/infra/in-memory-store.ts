import type { CityStore } from "../app/ports";
import type { User } from "../domain/user";
import type { Subscription } from "../domain/subscription";
import type { Invoice } from "../domain/payment";
import type { VpnConfig } from "../domain/vpn-config";

export class InMemoryCityStore implements CityStore {
	private users = new Map<number, User>();
	private subscriptions = new Map<string, Subscription>();
	private invoices = new Map<string, Invoice>();
	private configs = new Map<string, VpnConfig>();

	async findUser(userId: number): Promise<User | null> {
		return this.users.get(userId) ?? null;
	}

	async saveUser(user: User): Promise<void> {
		this.users.set(user.id, user);
	}

	async findSubscriptionByUser(userId: number): Promise<Subscription | null> {
		for (const subscription of this.subscriptions.values()) {
			if (subscription.userId === userId) return subscription;
		}
		return null;
	}

	async findSubscriptionById(id: string): Promise<Subscription | null> {
		return this.subscriptions.get(id) ?? null;
	}

	async saveSubscription(subscription: Subscription): Promise<void> {
		this.subscriptions.set(subscription.id, subscription);
	}

	async saveInvoice(invoice: Invoice): Promise<void> {
		this.invoices.set(invoice.id, invoice);
	}

	async findInvoice(id: string): Promise<Invoice | null> {
		return this.invoices.get(id) ?? null;
	}

	async saveVpnConfig(config: VpnConfig): Promise<void> {
		this.configs.set(config.id, config);
	}

	async findVpnConfig(id: string): Promise<VpnConfig | null> {
		return this.configs.get(id) ?? null;
	}
}
