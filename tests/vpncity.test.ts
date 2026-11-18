import { describe, expect, it } from "bun:test";
import { createVpnCity } from "../src/infra/composition";

describe("VPN City subscription flow", () => {
	it("returns three plans", () => {
		const app = createVpnCity();
		const plans = app.getPlans();
		expect(plans.map((plan) => plan.id)).toEqual(["1m", "6m", "1y"]);
	});

	it("creates a pending subscription and invoice", async () => {
		const app = createVpnCity();
		const result = await app.buySubscription({
			userId: 42,
			planId: "1m",
			profile: { firstName: "Test", username: "tester" },
		});

		expect(result.subscription.status).toBe("pending");
		expect(result.subscription.planId).toBe("1m");
		expect(result.invoice.status).toBe("pending");
		expect(result.invoice.amountStars).toBe(50);
		expect(result.invoice.subscriptionId).toBe(result.subscription.id);
	});

	it("activates the subscription and issues a config after payment", async () => {
		const app = createVpnCity();
		const order = await app.buySubscription({ userId: 7, planId: "6m" });
		const paid = await app.confirmPayment(order.invoice.id);

		expect(paid.subscription.status).toBe("active");
		expect(paid.subscription.vpnConfigId).toBe(paid.config.id);
		expect(paid.config.content).toContain("remote vpn.example.com");
		expect(paid.plan.durationDays).toBe(180);
	});

	it("returns the active subscription with days left", async () => {
		const app = createVpnCity();
		const order = await app.buySubscription({ userId: 99, planId: "1y" });
		await app.confirmPayment(order.invoice.id);

		const status = await app.getStatus(99);
		expect(status.subscription?.status).toBe("active");
		expect(status.plan?.id).toBe("1y");
		expect(status.daysLeft).toBeGreaterThan(300);
		expect(status.config).not.toBeNull();
	});

	it("returns empty status for an unknown user", async () => {
		const app = createVpnCity();
		const status = await app.getStatus(12345);
		expect(status.user).toBeNull();
		expect(status.subscription).toBeNull();
		expect(status.plan).toBeNull();
	});

	it("rejects an unknown plan", async () => {
		const app = createVpnCity();
		expect(app.buySubscription({ userId: 1, planId: "nope" })).rejects.toThrow(
			"Plan not found",
		);
	});

	it("rejects a second payment for the same invoice", async () => {
		const app = createVpnCity();
		const order = await app.buySubscription({ userId: 5, planId: "1m" });
		await app.confirmPayment(order.invoice.id);
		expect(app.confirmPayment(order.invoice.id)).rejects.toThrow(
			"Invoice already paid",
		);
	});
});
