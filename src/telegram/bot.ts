import { TelegramClient } from "@bot-machine/telegram-client";
import type { Message, User as TelegramUser } from "@bot-machine/telegram-client";
import { createVpnCity } from "../infra/composition";
import {
	showConfig,
	showInvoice,
	showMainMenu,
	showPlan,
	showPlans,
	showStatus,
} from "./views";
import { findPlan } from "../domain/plans";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
	console.error("BOT_TOKEN is not set");
	process.exit(1);
}

const client = new TelegramClient(BOT_TOKEN);
const app = createVpnCity();

const profileOf = (from: TelegramUser) => ({
	firstName: from.first_name,
	lastName: from.last_name ?? null,
	username: from.username ?? null,
});

async function sendStatus(chatId: number, userId: number, messageId?: number) {
	const status = await app.getStatus(userId);
	await showStatus(client, chatId, status, messageId);
}

async function handleMessage(message: Message): Promise<void> {
	const chatId = message.chat.id;
	if (!message.from) return;
	const from = message.from;
	const text = message.text ?? "";

	if (text.startsWith("/start")) {
		await showMainMenu(client, chatId);
		return;
	}
	if (text === "/help") {
		await client.sendMessage({
			chat_id: chatId,
			text:
				"<b>VPN City</b>\n\n" +
				"/start — меню\n" +
				"Купить VPN — тарифы и mock-оплата\n" +
				"Моя подписка — статус и срок",
			parse_mode: "HTML",
		});
		return;
	}

	await showMainMenu(client, chatId);
}

async function main(): Promise<void> {
	console.log("VPN City bot is running");
	let offset = 0;

	while (true) {
		try {
			const updates = await client.getUpdates({ offset, timeout: 30 });

			for (const update of updates) {
				offset = update.update_id + 1;

				const query = update.callback_query;
				if (query) {
					const chatId = query.message?.chat.id;
					if (!chatId) continue;
					const data = query.data ?? "";

					if (data === "buy") {
						await showPlans(client, chatId, app.getPlans());
					} else if (data === "status") {
						await sendStatus(chatId, query.from.id);
					} else if (data === "back") {
						await showMainMenu(client, chatId);
					} else if (data.startsWith("plan:")) {
						const plan = findPlan(data.slice("plan:".length));
						if (plan) await showPlan(client, chatId, plan);
					} else if (data.startsWith("pay:")) {
						const planId = data.slice("pay:".length);
						try {
							const order = await app.buySubscription({
								userId: query.from.id,
								planId,
								profile: profileOf(query.from),
							});
							await showInvoice(client, chatId, order.invoice.id, order.invoice.amountStars);
							await app.confirmPayment(order.invoice.id);
							const status = await app.getStatus(query.from.id);
							if (status.config) await showConfig(client, chatId, status.config);
							await showStatus(client, chatId, status);
						} catch (error) {
							await client.sendMessage({
								chat_id: chatId,
								text: `Не удалось оформить подписку: ${(error as Error).message}`,
								parse_mode: "HTML",
							});
						}
					}

					await client.answerCallbackQuery({ callback_query_id: query.id });
					continue;
				}

				if (update.message) await handleMessage(update.message);
			}
		} catch (error) {
			console.error("Bot loop error:", error);
			await new Promise((resolve) => setTimeout(resolve, 5_000));
		}
	}
}

main();
