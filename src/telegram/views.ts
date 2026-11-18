import type { TelegramClient, InlineKeyboardMarkup, Message } from "@bot-machine/telegram-client";
import type { Plan } from "../domain/plans";
import type { Subscription } from "../domain/subscription";
import type { VpnConfig } from "../domain/vpn-config";
import type { User } from "../domain/user";

const escapeHtml = (value: string): string =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function sendOrEdit(
	client: TelegramClient,
	chatId: number,
	text: string,
	keyboard: InlineKeyboardMarkup,
	messageId?: number,
): Promise<Message> {
	const payload = {
		chat_id: chatId,
		text,
		parse_mode: "HTML" as const,
		reply_markup: keyboard,
	};

	if (messageId) {
		const result = await client.editMessageText({ ...payload, message_id: messageId });
		return typeof result === "boolean"
			? { message_id: messageId, chat: { id: chatId, type: "private" }, date: 0 }
			: result;
	}
	return client.sendMessage(payload);
}

const mainKeyboard: InlineKeyboardMarkup = {
	inline_keyboard: [
		[{ text: "🛒 Купить VPN", callback_data: "buy" }],
		[{ text: "ℹ️ Моя подписка", callback_data: "status" }],
	],
};

export const showMainMenu = async (
	client: TelegramClient,
	chatId: number,
	messageId?: number,
): Promise<Message> =>
	sendOrEdit(
		client,
		chatId,
		"<b>VPN City</b>\n\n" +
			"Подписка на VPN с оплатой в Telegram Stars.\n" +
			"Тарифы, счёт и выдача конфига — в одном боте.",
		mainKeyboard,
		messageId,
	);

export const showPlans = async (
	client: TelegramClient,
	chatId: number,
	plans: Plan[],
	messageId?: number,
): Promise<Message> => {
	const lines = plans.map(
		(plan) =>
			`<b>${escapeHtml(plan.name)}</b> — ${plan.priceStars} ⭐\n` +
			`<i>${escapeHtml(plan.description)}</i>`,
	);

	const keyboard: InlineKeyboardMarkup = {
		inline_keyboard: [
			...plans.map((plan) => [
				{
					text: `${plan.name} — ${plan.priceStars} ⭐`,
					callback_data: `plan:${plan.id}`,
				},
			]),
			[{ text: "⬅️ Назад", callback_data: "back" }],
		],
	};

	return sendOrEdit(
		client,
		chatId,
		`<b>Выберите тариф</b>\n\n${lines.join("\n\n")}`,
		keyboard,
		messageId,
	);
};

export const showPlan = async (
	client: TelegramClient,
	chatId: number,
	plan: Plan,
	messageId?: number,
): Promise<Message> =>
	sendOrEdit(
		client,
		chatId,
		`<b>${escapeHtml(plan.name)}</b>\n\n` +
			`${escapeHtml(plan.description)}\n` +
			`Срок: ${plan.durationDays} дней\n` +
			`Цена: <b>${plan.priceStars} ⭐</b>\n\n` +
			"Оплата демонстрационная: платёж подтверждается сразу.",
		{
			inline_keyboard: [
				[{ text: `Оплатить ${plan.priceStars} ⭐`, callback_data: `pay:${plan.id}` }],
				[{ text: "⬅️ К тарифам", callback_data: "buy" }],
			],
		},
		messageId,
	);

export const showInvoice = async (
	client: TelegramClient,
	chatId: number,
	invoiceId: string,
	amountStars: number,
): Promise<Message> =>
	client.sendMessage({
		chat_id: chatId,
		text:
			`<b>Счёт создан</b>\n\n` +
			`Номер: <code>${escapeHtml(invoiceId)}</code>\n` +
			`Сумма: <b>${amountStars} ⭐</b>\n\n` +
			"Это mock-платёж: провайдер не подключён, оплата подтверждается сразу.",
		parse_mode: "HTML",
	});

export const showConfig = async (
	client: TelegramClient,
	chatId: number,
	config: VpnConfig,
): Promise<Message> =>
	client.sendMessage({
		chat_id: chatId,
		text:
			"<b>Оплата прошла. Конфиг готов.</b>\n\n" +
			`Сервер: <code>${escapeHtml(config.serverLocation)}</code>\n\n` +
			`<pre>${escapeHtml(config.content)}</pre>`,
		parse_mode: "HTML",
	});

export const showStatus = async (
	client: TelegramClient,
	chatId: number,
	data: {
		user: User | null;
		subscription: Subscription | null;
		plan: Plan | null;
		config: VpnConfig | null;
		daysLeft: number;
	},
	messageId?: number,
): Promise<Message> => {
	if (!data.subscription || !data.plan) {
		return sendOrEdit(
			client,
			chatId,
			"<b>Активной подписки нет.</b>\n\nМожно выбрать тариф и оформить подписку.",
			{
				inline_keyboard: [
					[{ text: "🛒 Купить VPN", callback_data: "buy" }],
					[{ text: "⬅️ Назад", callback_data: "back" }],
				],
			},
			messageId,
		);
	}

	const end = data.subscription.endDate.toLocaleDateString("ru-RU");
	const status = data.subscription.status === "active" ? "активна" : "истекла";

	return sendOrEdit(
		client,
		chatId,
		`<b>Ваша подписка</b>\n\n` +
			`Тариф: <b>${escapeHtml(data.plan.name)}</b>\n` +
			`Статус: <b>${status}</b>\n` +
			`Действует до: <b>${end}</b>\n` +
			`Осталось: <b>${data.daysLeft} дней</b>\n` +
			`Конфиг: ${data.config ? "выдан" : "не выдан"}`,
		{
			inline_keyboard: [
				[{ text: "🛒 Купить VPN", callback_data: "buy" }],
				[{ text: "⬅️ Назад", callback_data: "back" }],
			],
		},
		messageId,
	);
};
