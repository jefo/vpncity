import type { VpnProvider } from "../app/ports";
import type { VpnConfig } from "../domain/vpn-config";

let counter = 0;

export class MockVpnProvider implements VpnProvider {
	async issue(input: {
		user: { id: number };
		plan: { id: string; name: string };
		subscription: { id: string };
	}): Promise<VpnConfig> {
		counter += 1;
		const id = `vpn_${input.user.id}_${Date.now()}_${counter}`;

		return {
			id,
			userId: input.user.id,
			subscriptionId: input.subscription.id,
			serverLocation: "demo-node-1",
			status: "active",
			content: `client
dev tun
proto udp
remote vpn.example.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
verb 3
# plan: ${input.plan.name}
# user: ${input.user.id}`,
		};
	}

	async revoke(_configId: string): Promise<void> {
		return;
	}
}
