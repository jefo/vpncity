import type { PaymentGateway } from "../app/ports";
import type { Invoice } from "../domain/payment";

let counter = 0;

export class MockPaymentGateway implements PaymentGateway {
	async createInvoice(input: {
		userId: number;
		subscriptionId: string;
		amountStars: number;
	}): Promise<Invoice> {
		counter += 1;
		const id = `inv_${input.userId}_${Date.now()}_${counter}`;

		return {
			id,
			userId: input.userId,
			subscriptionId: input.subscriptionId,
			amountStars: input.amountStars,
			status: "pending",
			paymentUrl: `https://t.me/$mock-invoice-${id}`,
			createdAt: new Date(),
		};
	}

	async markPaid(invoice: Invoice): Promise<Invoice> {
		return { ...invoice, status: "completed" };
	}
}
