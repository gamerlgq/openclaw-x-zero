import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-Bje8XVt9.js";
import { r as buildModelCatalogMergeKey } from "./normalize-CtLIxVHe.js";
import { c as planManifestModelCatalogSuppressions } from "./manifest-BRvO4Lcw.js";
import { r as normalizeProviderId } from "./provider-id-DMUF3fJY.js";
import { n as loadPluginManifestRegistryForPluginRegistry } from "./plugin-registry-Bjn9rPwy.js";
//#region src/plugins/manifest-model-suppression.ts
let cacheWithoutConfig = /* @__PURE__ */ new WeakMap();
let cacheByConfig = /* @__PURE__ */ new WeakMap();
function resolveSuppressionCache(params) {
	if (!params.config) {
		let cache = cacheWithoutConfig.get(params.env);
		if (!cache) {
			cache = /* @__PURE__ */ new Map();
			cacheWithoutConfig.set(params.env, cache);
		}
		return cache;
	}
	let envCaches = cacheByConfig.get(params.config);
	if (!envCaches) {
		envCaches = /* @__PURE__ */ new WeakMap();
		cacheByConfig.set(params.config, envCaches);
	}
	let cache = envCaches.get(params.env);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		envCaches.set(params.env, cache);
	}
	return cache;
}
function cacheKey(params) {
	return params.workspaceDir ?? "";
}
function listManifestModelCatalogSuppressions(params) {
	const cache = resolveSuppressionCache({
		config: params.config,
		env: params.env
	});
	const key = cacheKey(params);
	const cached = cache.get(key);
	if (cached) return cached;
	const planned = planManifestModelCatalogSuppressions({ registry: loadPluginManifestRegistryForPluginRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) });
	cache.set(key, planned.suppressions);
	return planned.suppressions;
}
function buildManifestSuppressionError(params) {
	const ref = `${params.provider}/${params.modelId}`;
	return params.reason ? `Unknown model: ${ref}. ${params.reason}` : `Unknown model: ${ref}.`;
}
function normalizeBaseUrlHost(baseUrl) {
	const trimmed = baseUrl?.trim();
	if (!trimmed) return "";
	try {
		return normalizeSuppressionHost(new URL(trimmed).hostname);
	} catch {
		return "";
	}
}
function normalizeSuppressionHost(host) {
	return normalizeLowercaseStringOrEmpty(host).replace(/\.+$/, "");
}
function resolveConfiguredProviderValue(params) {
	const providers = params.config?.models?.providers;
	if (!providers) return;
	for (const [providerId, entry] of Object.entries(providers)) {
		if (normalizeLowercaseStringOrEmpty(providerId) !== params.provider) continue;
		return {
			api: normalizeLowercaseStringOrEmpty(entry?.api),
			baseUrl: typeof entry?.baseUrl === "string" ? entry.baseUrl : void 0
		};
	}
}
function manifestSuppressionMatchesConditions(params) {
	const when = params.suppression.when;
	if (!when) return true;
	const configuredProvider = resolveConfiguredProviderValue({
		provider: params.provider,
		config: params.config
	});
	if (when.providerConfigApiIn?.length && configuredProvider?.api) {
		if (!new Set(when.providerConfigApiIn.map(normalizeLowercaseStringOrEmpty)).has(configuredProvider.api)) return false;
	}
	if (when.baseUrlHosts?.length) {
		const baseUrlHost = normalizeBaseUrlHost(params.baseUrl ?? configuredProvider?.baseUrl);
		if (!baseUrlHost) return false;
		if (!new Set(when.baseUrlHosts.map(normalizeSuppressionHost)).has(baseUrlHost)) return false;
	}
	return true;
}
function resolveManifestBuiltInModelSuppression(params) {
	const provider = normalizeLowercaseStringOrEmpty(params.provider);
	const modelId = normalizeLowercaseStringOrEmpty(params.id);
	if (!provider || !modelId) return;
	const mergeKey = buildModelCatalogMergeKey(provider, modelId);
	const suppression = listManifestModelCatalogSuppressions({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env
	}).find((entry) => entry.mergeKey === mergeKey && manifestSuppressionMatchesConditions({
		suppression: entry,
		provider,
		baseUrl: params.baseUrl,
		config: params.config
	}));
	if (!suppression) return;
	return {
		suppress: true,
		errorMessage: buildManifestSuppressionError({
			provider,
			modelId,
			reason: suppression.reason
		})
	};
}
//#endregion
//#region src/agents/model-suppression.ts
function resolveBuiltInModelSuppressionFromManifest(params) {
	const provider = normalizeProviderId(params.provider ?? "");
	const modelId = normalizeLowercaseStringOrEmpty(params.id);
	if (!provider || !modelId) return;
	return resolveManifestBuiltInModelSuppression({
		provider,
		id: modelId,
		...params.config ? { config: params.config } : {},
		...params.baseUrl ? { baseUrl: params.baseUrl } : {},
		env: process.env
	});
}
function resolveBuiltInModelSuppression(params) {
	const manifestResult = resolveBuiltInModelSuppressionFromManifest(params);
	if (manifestResult?.suppress) return manifestResult;
	const provider = normalizeProviderId(params.provider ?? "");
	const modelId = normalizeLowercaseStringOrEmpty(params.id);
	if (!provider || !modelId) return;
}
function shouldSuppressBuiltInModelFromManifest(params) {
	return resolveBuiltInModelSuppressionFromManifest(params)?.suppress ?? false;
}
function shouldSuppressBuiltInModel(params) {
	return resolveBuiltInModelSuppression(params)?.suppress ?? false;
}
function buildSuppressedBuiltInModelError(params) {
	return resolveBuiltInModelSuppression(params)?.errorMessage;
}
//#endregion
export { shouldSuppressBuiltInModel as n, shouldSuppressBuiltInModelFromManifest as r, buildSuppressedBuiltInModelError as t };
