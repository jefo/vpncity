import { InMemoryCityStore } from "./in-memory-store";
import { MockPaymentGateway } from "./mock-payment";
import { MockVpnProvider } from "./mock-vpn";
import {
	buySubscription,
	confirmPayment,
	getPlans,
	getStatus,
} from "../app/use-cases";

export const createVpnCity = () => {
	const store = new InMemoryCityStore();
	const payment = new MockPaymentGateway();
	const vpn = new MockVpnProvider();

	return {
		getPlans,
		buySubscription: (input: Parameters<typeof buySubscription>[0]) =>
			buySubscription(input, { store, payment }),
		confirmPayment: (invoiceId: string) =>
			confirmPayment(invoiceId, { store, payment, vpn }),
		getStatus: (userId: number) => getStatus(userId, { store }),
	};
};

export type VpnCity = ReturnType<typeof createVpnCity>;
