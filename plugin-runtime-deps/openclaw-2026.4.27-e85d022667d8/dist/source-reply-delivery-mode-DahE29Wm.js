import { t as normalizeChatType } from "./chat-type-DuQW6e8F.js";
//#region src/auto-reply/reply/source-reply-delivery-mode.ts
function resolveSourceReplyDeliveryMode(params) {
	if (params.requested) return params.requested;
	const chatType = normalizeChatType(params.ctx.ChatType);
	if (chatType === "group" || chatType === "channel") return params.cfg.messages?.groupChat?.visibleReplies === "automatic" ? "automatic" : "message_tool_only";
	return "automatic";
}
function resolveSourceReplyVisibilityPolicy(params) {
	const sourceReplyDeliveryMode = resolveSourceReplyDeliveryMode({
		cfg: params.cfg,
		ctx: params.ctx,
		requested: params.requested
	});
	const sendPolicyDenied = params.sendPolicy === "deny";
	const suppressAutomaticSourceDelivery = sourceReplyDeliveryMode === "message_tool_only";
	const suppressDelivery = sendPolicyDenied || suppressAutomaticSourceDelivery;
	const deliverySuppressionReason = sendPolicyDenied ? "sendPolicy: deny" : suppressAutomaticSourceDelivery ? "sourceReplyDeliveryMode: message_tool_only" : "";
	return {
		sourceReplyDeliveryMode,
		sendPolicyDenied,
		suppressAutomaticSourceDelivery,
		suppressDelivery,
		suppressHookUserDelivery: params.suppressAcpChildUserDelivery === true || suppressDelivery,
		suppressHookReplyLifecycle: sendPolicyDenied || params.suppressAcpChildUserDelivery === true || params.explicitSuppressTyping === true || params.shouldSuppressTyping === true,
		suppressTyping: sendPolicyDenied || params.explicitSuppressTyping === true || params.shouldSuppressTyping === true,
		deliverySuppressionReason
	};
}
//#endregion
export { resolveSourceReplyVisibilityPolicy as n, resolveSourceReplyDeliveryMode as t };
