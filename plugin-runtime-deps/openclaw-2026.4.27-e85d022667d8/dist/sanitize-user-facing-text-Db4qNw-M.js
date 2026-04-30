import { a as normalizeLowercaseStringOrEmpty, s as normalizeOptionalLowercaseString } from "./string-coerce-Bje8XVt9.js";
import { l as stripInternalRuntimeContext } from "./internal-runtime-context-CAhrFMl2.js";
import { n as stripInboundMetadata } from "./strip-inbound-meta-ByzEWAV3.js";
import { c as isTimeoutErrorMessage, i as isOverloadedErrorMessage, o as isRateLimitErrorMessage, r as isBillingErrorMessage } from "./failover-matches-T6LUQcna.js";
//#region src/shared/assistant-error-format.ts
const ERROR_PAYLOAD_PREFIX_RE = /^(?:error|(?:[a-z][\w-]*\s+)?api\s*error|apierror|openai\s*error|anthropic\s*error|gateway\s*error|codex\s*error)(?:\s+\d{3})?[:\s-]+/i;
const HTTP_STATUS_DELIMITER_RE = /(?:\s*:\s*|\s+)/;
const HTTP_STATUS_PREFIX_RE = new RegExp(`^(?:http\\s*)?(\\d{3})${HTTP_STATUS_DELIMITER_RE.source}(.+)$`, "i");
const HTTP_STATUS_CODE_PREFIX_RE = new RegExp(`^(?:http\\s*)?(\\d{3})(?:${HTTP_STATUS_DELIMITER_RE.source}([\\s\\S]+))?$`, "i");
const HTML_ERROR_PREFIX_RE = /^\s*(?:<!doctype\s+html\b|<html\b)/i;
const HTML_CLOSE_RE = /<\/html>/i;
const CLOUDFLARE_HTML_ERROR_CODES = new Set([
	521,
	522,
	523,
	524,
	525,
	526,
	530
]);
const STANDALONE_HTML_ERROR_HINT_RE = /\bcloudflare\b|cdn-cgi\/challenge-platform|challenge-error-text|enable javascript and cookies to continue|access denied|forbidden|service unavailable|bad gateway|web server is down|captcha|attention required/i;
function isErrorPayloadObject(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
	const record = payload;
	if (record.type === "error") return true;
	if (typeof record.request_id === "string" || typeof record.requestId === "string") return true;
	if ("error" in record) {
		const err = record.error;
		if (err && typeof err === "object" && !Array.isArray(err)) {
			const errRecord = err;
			if (typeof errRecord.message === "string" || typeof errRecord.type === "string" || typeof errRecord.code === "string") return true;
		}
	}
	return false;
}
function parseApiErrorPayload(raw) {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const candidates = [trimmed];
	if (ERROR_PAYLOAD_PREFIX_RE.test(trimmed)) candidates.push(trimmed.replace(ERROR_PAYLOAD_PREFIX_RE, "").trim());
	for (const candidate of candidates) {
		if (!candidate.startsWith("{") || !candidate.endsWith("}")) continue;
		try {
			const parsed = JSON.parse(candidate);
			if (isErrorPayloadObject(parsed)) return parsed;
		} catch {}
	}
	return null;
}
function extractLeadingHttpStatus(raw) {
	const match = raw.match(HTTP_STATUS_CODE_PREFIX_RE);
	if (!match) return null;
	const code = Number(match[1]);
	if (!Number.isFinite(code)) return null;
	return {
		code,
		rest: (match[2] ?? "").trim()
	};
}
function isCloudflareOrHtmlErrorPage(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return false;
	if (HTML_ERROR_PREFIX_RE.test(trimmed) && HTML_CLOSE_RE.test(trimmed) && STANDALONE_HTML_ERROR_HINT_RE.test(trimmed)) return true;
	const status = extractLeadingHttpStatus(trimmed);
	if (!status || status.code < 500) return false;
	if (CLOUDFLARE_HTML_ERROR_CODES.has(status.code)) return true;
	return status.code < 600 && HTML_ERROR_PREFIX_RE.test(status.rest) && HTML_CLOSE_RE.test(status.rest);
}
function parseApiErrorInfo(raw) {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;
	let httpCode;
	let candidate = trimmed;
	const httpPrefixMatch = candidate.match(/^(\d{3})\s+(.+)$/s);
	if (httpPrefixMatch) {
		httpCode = httpPrefixMatch[1];
		candidate = httpPrefixMatch[2].trim();
	}
	const payload = parseApiErrorPayload(candidate);
	if (!payload) return null;
	const requestId = typeof payload.request_id === "string" ? payload.request_id : typeof payload.requestId === "string" ? payload.requestId : void 0;
	const topType = typeof payload.type === "string" ? payload.type : void 0;
	const topMessage = typeof payload.message === "string" ? payload.message : void 0;
	let errType;
	let errMessage;
	if (payload.error && typeof payload.error === "object" && !Array.isArray(payload.error)) {
		const err = payload.error;
		if (typeof err.type === "string") errType = err.type;
		if (typeof err.code === "string" && !errType) errType = err.code;
		if (typeof err.message === "string") errMessage = err.message;
	}
	return {
		httpCode,
		type: errType ?? topType,
		message: errMessage ?? topMessage,
		requestId
	};
}
function formatRawAssistantErrorForUi(raw) {
	const trimmed = (raw ?? "").trim();
	if (!trimmed) return "LLM request failed with an unknown error.";
	const leadingStatus = extractLeadingHttpStatus(trimmed);
	const isHtmlChallenge = isCloudflareOrHtmlErrorPage(trimmed);
	if (leadingStatus && isHtmlChallenge) return `The AI service is temporarily unavailable (HTTP ${leadingStatus.code}). Please try again in a moment.`;
	if (isHtmlChallenge) return "The provider returned an HTML error page instead of an API response. This usually means a CDN or gateway (e.g. Cloudflare) blocked the request. Retry in a moment or check provider status.";
	const httpMatch = trimmed.match(HTTP_STATUS_PREFIX_RE);
	if (httpMatch) {
		const rest = httpMatch[2].trim();
		if (!rest.startsWith("{")) return `HTTP ${httpMatch[1]}: ${rest}`;
	}
	const info = parseApiErrorInfo(trimmed);
	if (info?.message) return `${info.httpCode ? `HTTP ${info.httpCode}` : "LLM error"}${info.type ? ` ${info.type}` : ""}: ${info.message}`;
	return trimmed.length > 600 ? `${trimmed.slice(0, 600)}…` : trimmed;
}
//#endregion
//#region src/shared/chat-content.ts
function coerceChatContentText(value) {
	if (typeof value === "string") return value;
	if (value == null) return "";
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint" || typeof value === "symbol") return String(value);
	if (typeof value === "object") try {
		return JSON.stringify(value) ?? "";
	} catch {
		return "";
	}
	return "";
}
function extractTextFromChatContent(content, opts) {
	const normalizeText = opts?.normalizeText ?? ((text) => text.replace(/\s+/g, " ").trim());
	const joinWith = opts?.joinWith ?? " ";
	const sanitize = (text) => {
		const raw = coerceChatContentText(text);
		return coerceChatContentText(opts?.sanitizeText ? opts.sanitizeText(raw) : raw);
	};
	const normalize = (text) => coerceChatContentText(normalizeText(coerceChatContentText(text)));
	if (typeof content === "string") {
		const normalized = normalize(sanitize(content));
		return normalized ? normalized : null;
	}
	if (!Array.isArray(content)) return null;
	const chunks = [];
	for (const block of content) {
		if (!block || typeof block !== "object") continue;
		if (block.type !== "text") continue;
		const text = block.text;
		const value = sanitize(text);
		if (value.trim()) chunks.push(value);
	}
	const joined = normalize(chunks.join(joinWith));
	return joined ? joined : null;
}
//#endregion
//#region src/agents/exec-approval-result.ts
const EXEC_DENIED_RE = /^exec denied \(([^)]*)\):(?:\s*([\s\S]*))?$/i;
const EXEC_FINISHED_RE = /^exec finished \(([^)]*)\)(?:\n([\s\S]*))?$/i;
const EXEC_COMPLETED_RE = /^exec completed:\s*([\s\S]*)$/i;
function parseExecApprovalResultText(resultText) {
	const raw = resultText.trim();
	if (!raw) return {
		kind: "other",
		raw
	};
	const deniedMatch = EXEC_DENIED_RE.exec(raw);
	if (deniedMatch) return {
		kind: "denied",
		raw,
		metadata: deniedMatch[1]?.trim() ?? "",
		body: deniedMatch[2]?.trim() ?? ""
	};
	const finishedMatch = EXEC_FINISHED_RE.exec(raw);
	if (finishedMatch) return {
		kind: "finished",
		raw,
		metadata: finishedMatch[1]?.trim() ?? "",
		body: finishedMatch[2]?.trim() ?? ""
	};
	const completedMatch = EXEC_COMPLETED_RE.exec(raw);
	if (completedMatch) return {
		kind: "completed",
		raw,
		body: completedMatch[1]?.trim() ?? ""
	};
	return {
		kind: "other",
		raw
	};
}
function isExecDeniedResultText(resultText) {
	return parseExecApprovalResultText(resultText).kind === "denied";
}
function formatExecDeniedUserMessage(resultText) {
	const parsed = parseExecApprovalResultText(resultText);
	if (parsed.kind !== "denied") return null;
	const metadata = normalizeLowercaseStringOrEmpty(parsed.metadata);
	if (metadata.includes("approval-timeout")) return "Command did not run: approval timed out.";
	if (metadata.includes("user-denied")) return "Command did not run: approval was denied.";
	if (metadata.includes("allowlist-miss")) return "Command did not run: approval is required.";
	if (metadata.includes("approval-request-failed")) return "Command did not run: approval request failed.";
	if (metadata.includes("spawn-failed") || metadata.includes("invoke-failed")) return "Command did not run.";
	return "Command did not run.";
}
//#endregion
//#region src/agents/stable-stringify.ts
function stableStringify(value) {
	if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
	if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
	const record = value;
	return `{${Object.keys(record).toSorted().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}
//#endregion
//#region src/agents/pi-embedded-helpers/sanitize-user-facing-text.ts
function formatBillingErrorMessage(provider, model) {
	const providerName = provider?.trim();
	const modelName = model?.trim();
	const providerLabel = providerName && modelName ? `${providerName} (${modelName})` : providerName || void 0;
	if (providerLabel) return `⚠️ ${providerLabel} returned a billing error — your API key has run out of credits or has an insufficient balance. Check your ${providerName} billing dashboard and top up or switch to a different API key.`;
	return "⚠️ API provider returned a billing error — your API key has run out of credits or has an insufficient balance. Check your provider's billing dashboard and top up or switch to a different API key.";
}
const BILLING_ERROR_USER_MESSAGE = formatBillingErrorMessage();
const RATE_LIMIT_ERROR_USER_MESSAGE = "⚠️ API rate limit reached. Please try again later.";
const MODEL_CAPACITY_ERROR_USER_MESSAGE = "⚠️ Selected model is at capacity. Try a different model, or wait and retry.";
const OVERLOADED_ERROR_USER_MESSAGE = "The AI service is temporarily overloaded. Please try again in a moment.";
const FINAL_TAG_RE = /<\s*\/?\s*final\s*>/gi;
const ERROR_PREFIX_RE = /^(?:error|(?:[a-z][\w-]*\s+)?api\s*error|openai\s*error|anthropic\s*error|gateway\s*error|codex\s*error|request failed|failed|exception)(?:\s+\d{3})?[:\s-]+/i;
const CONTEXT_OVERFLOW_ERROR_HEAD_RE = /^(?:context overflow:|request_too_large\b|request size exceeds\b|request exceeds the maximum size\b|context length exceeded\b|maximum context length\b|prompt is too long\b|exceeds model context window\b)/i;
const HTTP_ERROR_HINTS = [
	"error",
	"bad request",
	"not found",
	"unauthorized",
	"forbidden",
	"internal server",
	"service unavailable",
	"gateway",
	"rate limit",
	"overloaded",
	"timeout",
	"timed out",
	"invalid",
	"too many requests",
	"permission"
];
const RATE_LIMIT_SPECIFIC_HINT_RE = /\bmin(ute)?s?\b|\bhours?\b|\bseconds?\b|\btry again in\b|\breset\b|\bplan\b|\bquota\b/i;
const MODEL_CAPACITY_ERROR_RE = /\b(?:selected\s+)?model\s+(?:is\s+)?at capacity\b/i;
const NON_ERROR_PROVIDER_PAYLOAD_MAX_LENGTH = 16384;
const NON_ERROR_PROVIDER_PAYLOAD_PREFIX_RE = /^codex\s*error(?:\s+\d{3})?[:\s-]+/i;
function extractProviderRateLimitMessage(raw) {
	const withoutPrefix = raw.replace(ERROR_PREFIX_RE, "").trim();
	const candidate = (parseApiErrorInfo(raw) ?? parseApiErrorInfo(withoutPrefix))?.message ?? (extractLeadingHttpStatus(withoutPrefix)?.rest || withoutPrefix);
	if (!candidate || !RATE_LIMIT_SPECIFIC_HINT_RE.test(candidate)) return;
	if (isCloudflareOrHtmlErrorPage(withoutPrefix)) return;
	const trimmed = candidate.trim();
	if (trimmed.length > 300 || trimmed.startsWith("{") || /^(?:<!doctype\s+html\b|<html\b)/i.test(trimmed)) return;
	return `⚠️ ${trimmed}`;
}
function formatRateLimitOrOverloadedErrorCopy(raw) {
	if (isRateLimitErrorMessage(raw)) return extractProviderRateLimitMessage(raw) ?? RATE_LIMIT_ERROR_USER_MESSAGE;
	if (MODEL_CAPACITY_ERROR_RE.test(raw)) return MODEL_CAPACITY_ERROR_USER_MESSAGE;
	if (isOverloadedErrorMessage(raw)) return OVERLOADED_ERROR_USER_MESSAGE;
}
function formatTransportErrorCopy(raw) {
	if (!raw) return;
	if (isCloudflareOrHtmlErrorPage(raw)) return;
	const lower = normalizeLowercaseStringOrEmpty(raw);
	if (/\beconnrefused\b/i.test(raw) || lower.includes("connection refused") || lower.includes("actively refused")) return "LLM request failed: connection refused by the provider endpoint.";
	if (/\beconnreset\b|\beconnaborted\b|\benetreset\b|\bepipe\b/i.test(raw) || lower.includes("socket hang up") || lower.includes("connection reset") || lower.includes("connection aborted")) return "LLM request failed: network connection was interrupted.";
	if (/\benotfound\b|\beai_again\b/i.test(raw) || lower.includes("getaddrinfo") || lower.includes("no such host") || lower.includes("dns")) return "LLM request failed: DNS lookup for the provider endpoint failed.";
	if (/\benetunreach\b|\behostunreach\b|\behostdown\b/i.test(raw) || lower.includes("network is unreachable") || lower.includes("host is unreachable")) return "LLM request failed: the provider endpoint is unreachable from this host.";
	if (lower.includes("fetch failed") || lower.includes("connection error") || lower.includes("network request failed")) return "LLM request failed: network connection error.";
	if (raw.includes("网络错误") || raw.includes("网络异常") || raw.includes("连接错误")) return "LLM request failed: provider reported a network error.";
}
function formatDiskSpaceErrorCopy(raw) {
	if (!raw) return;
	const lower = normalizeLowercaseStringOrEmpty(raw);
	if (/\benospc\b/i.test(raw) || lower.includes("no space left on device") || lower.includes("disk full")) return "OpenClaw could not write local session data because the disk is full. Free some disk space and try again.";
}
function isReasoningConstraintErrorMessage(raw) {
	if (!raw) return false;
	const lower = normalizeLowercaseStringOrEmpty(raw);
	return lower.includes("reasoning is mandatory") || lower.includes("reasoning is required") || lower.includes("requires reasoning") || lower.includes("reasoning") && lower.includes("cannot be disabled");
}
function isInvalidStreamingEventOrderError(raw) {
	if (!raw) return false;
	const lower = normalizeLowercaseStringOrEmpty(raw);
	return lower.includes("unexpected event order") && lower.includes("message_start") && lower.includes("message_stop");
}
function hasRateLimitTpmHint(raw) {
	const lower = normalizeLowercaseStringOrEmpty(raw);
	return /\btpm\b/i.test(lower) || lower.includes("tokens per minute");
}
function looksLikeGenericContextOverflowError(raw) {
	if (!raw) return false;
	const lower = normalizeLowercaseStringOrEmpty(raw);
	const hasRequestSizeExceeds = lower.includes("request size exceeds");
	const hasContextWindow = lower.includes("context window") || lower.includes("context length") || lower.includes("maximum context length");
	return lower.includes("request_too_large") || lower.includes("invalid_argument") && lower.includes("maximum number of tokens") || lower.includes("request exceeds the maximum size") || lower.includes("context length exceeded") || lower.includes("maximum context length") || lower.includes("prompt is too long") || lower.includes("prompt too long") || lower.includes("exceeds model context window") || lower.includes("model token limit") || lower.includes("input exceeds") && lower.includes("maximum number of tokens") || hasRequestSizeExceeds && hasContextWindow || lower.includes("context overflow:") || lower.includes("exceed context limit") || lower.includes("exceeds the model's maximum context") || lower.includes("max_tokens") && lower.includes("exceed") && lower.includes("context") || lower.includes("input length") && lower.includes("exceed") && lower.includes("context") || lower.includes("413") && lower.includes("too large") || lower.includes("context_window_exceeded") || raw.includes("上下文过长") || raw.includes("上下文超出") || raw.includes("上下文长度超") || raw.includes("超出最大上下文") || raw.includes("请压缩上下文");
}
function shouldRewriteContextOverflowText(raw) {
	if (hasRateLimitTpmHint(raw) || isReasoningConstraintErrorMessage(raw)) return false;
	if (!looksLikeGenericContextOverflowError(raw)) return false;
	return isRawApiErrorPayload(raw) || isLikelyHttpErrorText(raw) || ERROR_PREFIX_RE.test(raw) || CONTEXT_OVERFLOW_ERROR_HEAD_RE.test(raw);
}
function getApiErrorPayloadFingerprint(raw) {
	if (!raw) return null;
	const payload = parseApiErrorPayload(raw);
	if (!payload) return null;
	return stableStringify(payload);
}
function isRawApiErrorPayload(raw) {
	return getApiErrorPayloadFingerprint(raw) !== null;
}
function isLikelyProviderErrorType(type) {
	const normalized = normalizeOptionalLowercaseString(type);
	if (!normalized) return false;
	return normalized.endsWith("_error");
}
function shouldRewriteRawPayloadWithoutErrorContext(raw) {
	if (raw.length > NON_ERROR_PROVIDER_PAYLOAD_MAX_LENGTH) return false;
	if (!NON_ERROR_PROVIDER_PAYLOAD_PREFIX_RE.test(raw)) return false;
	const info = parseApiErrorInfo(raw);
	if (!info) return false;
	if (isLikelyProviderErrorType(info.type)) return true;
	if (info.httpCode) {
		const parsedCode = Number(info.httpCode);
		if (Number.isFinite(parsedCode) && parsedCode >= 400) return true;
	}
	return false;
}
function stripFinalTagsFromText(text) {
	const normalized = coerceChatContentText(text);
	if (!normalized) return normalized;
	return normalized.replace(FINAL_TAG_RE, "");
}
function collapseConsecutiveDuplicateBlocks(text) {
	const trimmed = text.trim();
	if (!trimmed) return text;
	const blocks = trimmed.split(/\n{2,}/);
	if (blocks.length < 2) return text;
	const normalizeBlock = (value) => value.trim().replace(/\s+/g, " ");
	const result = [];
	let lastNormalized = null;
	for (const block of blocks) {
		const normalized = normalizeBlock(block);
		if (lastNormalized && normalized === lastNormalized) continue;
		result.push(block.trim());
		lastNormalized = normalized;
	}
	if (result.length === blocks.length) return text;
	return result.join("\n\n");
}
function isLikelyHttpErrorText(raw) {
	if (isCloudflareOrHtmlErrorPage(raw)) return true;
	const status = extractLeadingHttpStatus(raw);
	if (!status) return false;
	if (status.code < 400) return false;
	const message = normalizeLowercaseStringOrEmpty(status.rest);
	return HTTP_ERROR_HINTS.some((hint) => message.includes(hint));
}
function sanitizeUserFacingText(text, opts) {
	const raw = coerceChatContentText(text);
	if (!raw) return raw;
	const errorContext = opts?.errorContext ?? false;
	const stripped = stripInboundMetadata(stripInternalRuntimeContext(stripFinalTagsFromText(raw)));
	const trimmed = stripped.trim();
	if (!trimmed) return "";
	if (!errorContext && shouldRewriteRawPayloadWithoutErrorContext(trimmed)) return formatRawAssistantErrorForUi(trimmed);
	if (errorContext) {
		const execDeniedMessage = formatExecDeniedUserMessage(trimmed);
		if (execDeniedMessage) return execDeniedMessage;
		const diskSpaceCopy = formatDiskSpaceErrorCopy(trimmed);
		if (diskSpaceCopy) return diskSpaceCopy;
		if (/incorrect role information|roles must alternate/i.test(trimmed)) return "Message ordering conflict - please try again. If this persists, use /new to start a fresh session.";
		if (shouldRewriteContextOverflowText(trimmed)) return "Context overflow: prompt too large for the model. Try /reset (or /new) to start a fresh session, or use a larger-context model.";
		if (isBillingErrorMessage(trimmed)) return BILLING_ERROR_USER_MESSAGE;
		if (isInvalidStreamingEventOrderError(trimmed)) return "LLM request failed: provider returned an invalid streaming response. Please try again.";
		if (isRawApiErrorPayload(trimmed) || isLikelyHttpErrorText(trimmed)) return formatRawAssistantErrorForUi(trimmed);
		if (ERROR_PREFIX_RE.test(trimmed)) {
			const prefixedCopy = formatRateLimitOrOverloadedErrorCopy(trimmed);
			if (prefixedCopy) return prefixedCopy;
			const transportCopy = formatTransportErrorCopy(trimmed);
			if (transportCopy) return transportCopy;
			if (isTimeoutErrorMessage(trimmed)) return "LLM request timed out.";
			return formatRawAssistantErrorForUi(trimmed);
		}
	}
	return collapseConsecutiveDuplicateBlocks(stripped.replace(/^(?:[ \t]*\r?\n)+/, ""));
}
//#endregion
export { extractLeadingHttpStatus as _, formatTransportErrorCopy as a, isLikelyHttpErrorText as c, stableStringify as d, formatExecDeniedUserMessage as f, extractTextFromChatContent as g, coerceChatContentText as h, formatRateLimitOrOverloadedErrorCopy as i, isRawApiErrorPayload as l, parseExecApprovalResultText as m, formatBillingErrorMessage as n, getApiErrorPayloadFingerprint as o, isExecDeniedResultText as p, formatDiskSpaceErrorCopy as r, isInvalidStreamingEventOrderError as s, BILLING_ERROR_USER_MESSAGE as t, sanitizeUserFacingText as u, formatRawAssistantErrorForUi as v, parseApiErrorInfo as y };
