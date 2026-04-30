import { a as normalizeLowercaseStringOrEmpty, f as readStringValue } from "./string-coerce-Bje8XVt9.js";
//#region src/agents/openai-reasoning-effort.ts
const GPT_5_REASONING_EFFORTS = [
	"minimal",
	"low",
	"medium",
	"high"
];
const GPT_51_REASONING_EFFORTS = [
	"none",
	"low",
	"medium",
	"high"
];
const GPT_52_REASONING_EFFORTS = [
	"none",
	"low",
	"medium",
	"high",
	"xhigh"
];
const GPT_CODEX_REASONING_EFFORTS = [
	"low",
	"medium",
	"high",
	"xhigh"
];
const GPT_PRO_REASONING_EFFORTS = [
	"medium",
	"high",
	"xhigh"
];
const GPT_5_PRO_REASONING_EFFORTS = ["high"];
const GPT_51_CODEX_MAX_REASONING_EFFORTS = [
	"none",
	"medium",
	"high",
	"xhigh"
];
const GPT_51_CODEX_MINI_REASONING_EFFORTS = ["medium"];
const GENERIC_REASONING_EFFORTS = [
	"low",
	"medium",
	"high"
];
function normalizeModelId(id) {
	return normalizeLowercaseStringOrEmpty(id ?? "").replace(/-\d{4}-\d{2}-\d{2}$/u, "");
}
function normalizeOpenAIReasoningEffort(effort) {
	return effort === "minimal" ? "minimal" : effort;
}
function readCompatReasoningEfforts(compat) {
	if (!compat || typeof compat !== "object") return;
	const raw = compat.supportedReasoningEfforts;
	if (!Array.isArray(raw)) return;
	const supported = [...new Set(raw.filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))];
	return supported.length > 0 ? supported : void 0;
}
function isDisabledReasoningEffort(effort) {
	return effort === "none" || effort === "off";
}
function resolveOpenAISupportedReasoningEfforts(model) {
	const compatEfforts = readCompatReasoningEfforts(model.compat);
	if (compatEfforts) return compatEfforts;
	const provider = normalizeLowercaseStringOrEmpty(typeof model.provider === "string" ? model.provider : "");
	const id = normalizeModelId(typeof model.id === "string" ? model.id : void 0);
	if (id === "gpt-5.1-codex-mini") return GPT_51_CODEX_MINI_REASONING_EFFORTS;
	if (id === "gpt-5.1-codex-max") return GPT_51_CODEX_MAX_REASONING_EFFORTS;
	if (/^gpt-5(?:\.\d+)?-codex(?:-|$)/u.test(id) || provider === "openai-codex") return GPT_CODEX_REASONING_EFFORTS;
	if (id === "gpt-5-pro") return GPT_5_PRO_REASONING_EFFORTS;
	if (/^gpt-5\.[2-9](?:\.\d+)?-pro(?:-|$)/u.test(id)) return GPT_PRO_REASONING_EFFORTS;
	if (/^gpt-5\.[2-9](?:\.\d+)?(?:-|$)/u.test(id)) return GPT_52_REASONING_EFFORTS;
	if (/^gpt-5\.1(?:-|$)/u.test(id)) return GPT_51_REASONING_EFFORTS;
	if (/^gpt-5(?:-|$)/u.test(id)) return GPT_5_REASONING_EFFORTS;
	return GENERIC_REASONING_EFFORTS;
}
function supportsOpenAIReasoningEffort(model, effort) {
	return resolveOpenAISupportedReasoningEfforts(model).includes(normalizeOpenAIReasoningEffort(effort));
}
function resolveOpenAIReasoningEffortForModel(params) {
	const requested = normalizeOpenAIReasoningEffort(params.effort);
	const normalized = normalizeOpenAIReasoningEffort(params.fallbackMap?.[requested] ?? requested);
	const supported = resolveOpenAISupportedReasoningEfforts(params.model);
	if (supported.includes(normalized)) return normalized;
	if (isDisabledReasoningEffort(requested) || isDisabledReasoningEffort(normalized)) return;
	if (requested === "minimal" && supported.includes("low")) return "low";
	if ((requested === "minimal" || requested === "low") && supported.includes("medium")) return "medium";
	if (requested === "xhigh" && supported.includes("high")) return "high";
	return supported.find((effort) => effort !== "none");
}
//#endregion
//#region src/agents/openai-completions-string-content.ts
function flattenStringOnlyCompletionContent(content) {
	if (!Array.isArray(content)) return content;
	const textParts = [];
	for (const item of content) {
		if (!item || typeof item !== "object" || item.type !== "text" || typeof item.text !== "string") return content;
		textParts.push(item.text);
	}
	return textParts.join("\n");
}
function flattenCompletionMessagesToStringContent(messages) {
	return messages.map((message) => {
		if (!message || typeof message !== "object") return message;
		const content = message.content;
		const flattenedContent = flattenStringOnlyCompletionContent(content);
		if (flattenedContent === content) return message;
		return {
			...message,
			content: flattenedContent
		};
	});
}
//#endregion
//#region src/agents/openai-responses-payload-policy.ts
const OPENAI_RESPONSES_APIS = new Set([
	"openai-responses",
	"azure-openai-responses",
	"openai-codex-responses"
]);
const OPENAI_RESPONSES_PROVIDERS = new Set([
	"openai",
	"azure-openai",
	"azure-openai-responses"
]);
const LOCAL_ENDPOINT_HOSTS = new Set([
	"localhost",
	"127.0.0.1",
	"::1",
	"[::1]"
]);
const MODELSTUDIO_NATIVE_BASE_URLS = new Set([
	"https://coding-intl.dashscope.aliyuncs.com/v1",
	"https://coding.dashscope.aliyuncs.com/v1",
	"https://dashscope.aliyuncs.com/compatible-mode/v1",
	"https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
]);
const MOONSHOT_NATIVE_BASE_URLS = new Set(["https://api.moonshot.ai/v1", "https://api.moonshot.cn/v1"]);
function normalizeLowercaseString(value) {
	const stringValue = readStringValue(value)?.trim().toLowerCase();
	return stringValue ? stringValue : void 0;
}
function normalizeComparableBaseUrl(value) {
	const trimmed = readStringValue(value)?.trim();
	if (!trimmed) return;
	const parsedValue = /^[a-z0-9.[\]-]+(?::\d+)?(?:[/?#].*)?$/i.test(trimmed) ? `https://${trimmed}` : trimmed;
	try {
		const url = new URL(parsedValue);
		if (url.protocol !== "http:" && url.protocol !== "https:") return;
		url.hash = "";
		url.search = "";
		return url.toString().replace(/\/+$/, "").toLowerCase();
	} catch {
		return;
	}
}
function resolveUrlHostname(value) {
	const trimmed = readStringValue(value)?.trim();
	if (!trimmed) return;
	try {
		return new URL(trimmed).hostname.toLowerCase();
	} catch {
		try {
			return new URL(`https://${trimmed}`).hostname.toLowerCase();
		} catch {
			return;
		}
	}
}
function hostMatchesSuffix(host, suffix) {
	return suffix.startsWith(".") || suffix.startsWith("-") ? host.endsWith(suffix) : host === suffix || host.endsWith(`.${suffix}`);
}
function isLocalEndpointHost(host) {
	return LOCAL_ENDPOINT_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal");
}
function resolveBundledOpenAIResponsesEndpointClass(baseUrl) {
	const trimmed = readStringValue(baseUrl)?.trim();
	if (!trimmed) return "default";
	const host = resolveUrlHostname(trimmed);
	if (!host) return "invalid";
	const comparableBaseUrl = normalizeComparableBaseUrl(trimmed);
	switch (host) {
		case "api.anthropic.com": return "anthropic-public";
		case "api.cerebras.ai": return "cerebras-native";
		case "llm.chutes.ai": return "chutes-native";
		case "api.deepseek.com": return "deepseek-native";
		case "api.groq.com": return "groq-native";
		case "api.mistral.ai": return "mistral-public";
		case "api.openai.com": return "openai-public";
		case "chatgpt.com": return "openai-codex";
		case "generativelanguage.googleapis.com": return "google-generative-ai";
		case "aiplatform.googleapis.com": return "google-vertex";
		case "api.x.ai":
		case "api.grok.x.ai": return "xai-native";
		case "api.z.ai": return "zai-native";
	}
	if (hostMatchesSuffix(host, ".githubcopilot.com")) return "github-copilot-native";
	if (hostMatchesSuffix(host, ".openai.azure.com")) return "azure-openai";
	if (hostMatchesSuffix(host, "openrouter.ai")) return "openrouter";
	if (hostMatchesSuffix(host, "opencode.ai")) return "opencode-native";
	if (hostMatchesSuffix(host, "-aiplatform.googleapis.com")) return "google-vertex";
	if (comparableBaseUrl && MOONSHOT_NATIVE_BASE_URLS.has(comparableBaseUrl)) return "moonshot-native";
	if (comparableBaseUrl && MODELSTUDIO_NATIVE_BASE_URLS.has(comparableBaseUrl)) return "modelstudio-native";
	if (isLocalEndpointHost(host)) return "local";
	return "custom";
}
function isOpenAIResponsesApi(api) {
	return api !== void 0 && OPENAI_RESPONSES_APIS.has(api);
}
function readCompatPayloadBoolean(compat, key) {
	if (!compat || typeof compat !== "object") return;
	const value = compat[key];
	return typeof value === "boolean" ? value : void 0;
}
function resolveOpenAIResponsesPayloadCapabilities(model) {
	const provider = normalizeLowercaseString(model.provider);
	const api = normalizeLowercaseString(model.api);
	const endpointClass = resolveBundledOpenAIResponsesEndpointClass(model.baseUrl);
	const isResponsesApi = isOpenAIResponsesApi(api);
	const usesConfiguredBaseUrl = endpointClass !== "default";
	const usesKnownNativeOpenAIEndpoint = endpointClass === "openai-public" || endpointClass === "openai-codex" || endpointClass === "azure-openai";
	const usesKnownNativeOpenAIRoute = endpointClass === "default" ? provider === "openai" : usesKnownNativeOpenAIEndpoint;
	const usesExplicitProxyLikeEndpoint = usesConfiguredBaseUrl && !usesKnownNativeOpenAIEndpoint;
	const promptCacheKeySupport = readCompatPayloadBoolean(model.compat, "supportsPromptCacheKey");
	const shouldStripResponsesPromptCache = promptCacheKeySupport === true ? false : promptCacheKeySupport === false ? isResponsesApi : isResponsesApi && usesExplicitProxyLikeEndpoint;
	const supportsResponsesStoreField = readCompatPayloadBoolean(model.compat, "supportsStore") !== false && isResponsesApi;
	return {
		allowsOpenAIServiceTier: provider === "openai" && api === "openai-responses" && endpointClass === "openai-public" || provider === "openai-codex" && (api === "openai-codex-responses" || api === "openai-responses") && endpointClass === "openai-codex",
		allowsResponsesStore: supportsResponsesStoreField && provider !== void 0 && OPENAI_RESPONSES_PROVIDERS.has(provider) && usesKnownNativeOpenAIEndpoint,
		shouldStripResponsesPromptCache,
		supportsResponsesStoreField,
		usesKnownNativeOpenAIRoute
	};
}
function parsePositiveInteger(value) {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
	if (typeof value === "string") {
		const parsed = Number.parseInt(value, 10);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
}
function resolveOpenAIResponsesCompactThreshold(model) {
	const contextWindow = parsePositiveInteger(model.contextWindow);
	if (contextWindow) return Math.max(1e3, Math.floor(contextWindow * .7));
	return 8e4;
}
function shouldEnableOpenAIResponsesServerCompaction(explicitStore, provider, extraParams) {
	const configured = extraParams?.responsesServerCompaction;
	if (configured === false) return false;
	if (explicitStore !== true) return false;
	if (configured === true) return true;
	return provider === "openai";
}
function stripDisabledOpenAIReasoningPayload(payloadObj) {
	const reasoning = payloadObj.reasoning;
	if (reasoning === "none") {
		delete payloadObj.reasoning;
		return;
	}
	if (!reasoning || typeof reasoning !== "object" || Array.isArray(reasoning)) return;
	if (reasoning.effort === "none") delete payloadObj.reasoning;
}
function resolveOpenAIResponsesPayloadPolicy(model, options = {}) {
	const capabilities = resolveOpenAIResponsesPayloadCapabilities(model);
	const storeMode = options.storeMode ?? "provider-policy";
	const explicitStore = storeMode === "preserve" ? void 0 : storeMode === "disable" ? capabilities.supportsResponsesStoreField ? false : void 0 : capabilities.allowsResponsesStore ? true : void 0;
	const isResponsesApi = isOpenAIResponsesApi(normalizeLowercaseString(model.api));
	const shouldStripDisabledReasoningPayload = isResponsesApi && (!capabilities.usesKnownNativeOpenAIRoute || !supportsOpenAIReasoningEffort(model, "none"));
	return {
		allowsServiceTier: capabilities.allowsOpenAIServiceTier,
		compactThreshold: parsePositiveInteger(options.extraParams?.responsesCompactThreshold) ?? resolveOpenAIResponsesCompactThreshold(model),
		explicitStore,
		shouldStripDisabledReasoningPayload,
		shouldStripPromptCache: options.enablePromptCacheStripping === true && capabilities.shouldStripResponsesPromptCache,
		shouldStripStore: explicitStore !== true && readCompatPayloadBoolean(model.compat, "supportsStore") === false && isResponsesApi,
		useServerCompaction: options.enableServerCompaction === true && shouldEnableOpenAIResponsesServerCompaction(explicitStore, model.provider, options.extraParams)
	};
}
function applyOpenAIResponsesPayloadPolicy(payloadObj, policy) {
	if (policy.explicitStore !== void 0) payloadObj.store = policy.explicitStore;
	if (policy.shouldStripStore) delete payloadObj.store;
	if (policy.shouldStripPromptCache) {
		delete payloadObj.prompt_cache_key;
		delete payloadObj.prompt_cache_retention;
	}
	if (policy.useServerCompaction && payloadObj.context_management === void 0) payloadObj.context_management = [{
		type: "compaction",
		compact_threshold: policy.compactThreshold
	}];
	if (policy.shouldStripDisabledReasoningPayload) stripDisabledOpenAIReasoningPayload(payloadObj);
}
//#endregion
export { resolveOpenAIReasoningEffortForModel as a, normalizeOpenAIReasoningEffort as i, resolveOpenAIResponsesPayloadPolicy as n, flattenCompletionMessagesToStringContent as r, applyOpenAIResponsesPayloadPolicy as t };
