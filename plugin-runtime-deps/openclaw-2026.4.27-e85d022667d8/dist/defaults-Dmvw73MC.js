import { c as normalizeOptionalString } from "./string-coerce-Bje8XVt9.js";
import { n as loadPluginManifestRegistryForPluginRegistry } from "./plugin-registry-Bjn9rPwy.js";
import { h as resolveRuntimeConfigCacheKey } from "./runtime-snapshot-B8RGj9C7.js";
import { n as normalizeMediaProviderId, t as resolveImageCapableConfigProviderIds } from "./config-provider-models-BLe4SK7D.js";
import { n as resolvePluginCapabilityProviders } from "./capability-provider-runtime-D2czy7T_.js";
import { r as describeImagesWithModel, t as describeImageWithModel } from "./image-runtime-Dpz0bZ9D.js";
//#region src/media-understanding/manifest-metadata.ts
function buildMediaUnderstandingManifestMetadataRegistry(cfg) {
	const registry = /* @__PURE__ */ new Map();
	for (const plugin of loadPluginManifestRegistryForPluginRegistry({
		config: cfg,
		env: process.env,
		includeDisabled: true
	}).plugins) {
		const declaredProviders = new Set((plugin.contracts?.mediaUnderstandingProviders ?? []).map((providerId) => normalizeMediaProviderId(providerId)));
		for (const [providerId, metadata] of Object.entries(plugin.mediaUnderstandingProviderMetadata ?? {})) {
			const normalizedProviderId = normalizeMediaProviderId(providerId);
			if (!normalizedProviderId || !declaredProviders.has(normalizedProviderId)) continue;
			registry.set(normalizedProviderId, {
				id: normalizedProviderId,
				capabilities: metadata.capabilities,
				defaultModels: metadata.defaultModels,
				autoPriority: metadata.autoPriority,
				nativeDocumentInputs: metadata.nativeDocumentInputs
			});
		}
	}
	return registry;
}
//#endregion
//#region src/media-understanding/provider-registry.ts
function mergeProviderIntoRegistry(registry, provider, registryKey = provider.id) {
	const normalizedKey = normalizeMediaProviderId(registryKey);
	const existing = registry.get(normalizedKey);
	const merged = existing ? {
		...existing,
		...provider,
		capabilities: provider.capabilities ?? existing.capabilities,
		defaultModels: provider.defaultModels ?? existing.defaultModels,
		autoPriority: provider.autoPriority ?? existing.autoPriority,
		nativeDocumentInputs: provider.nativeDocumentInputs ?? existing.nativeDocumentInputs
	} : provider;
	registry.set(normalizedKey, merged);
}
function buildMediaUnderstandingRegistry(overrides, cfg) {
	const registry = /* @__PURE__ */ new Map();
	for (const provider of resolvePluginCapabilityProviders({
		key: "mediaUnderstandingProviders",
		cfg
	})) mergeProviderIntoRegistry(registry, provider);
	for (const normalizedKey of resolveImageCapableConfigProviderIds(cfg)) if (!registry.has(normalizedKey)) mergeProviderIntoRegistry(registry, {
		id: normalizedKey,
		capabilities: ["image"],
		describeImage: describeImageWithModel,
		describeImages: describeImagesWithModel
	});
	if (overrides) for (const [key, provider] of Object.entries(overrides)) mergeProviderIntoRegistry(registry, provider, key);
	return registry;
}
function getMediaUnderstandingProvider(id, registry) {
	return registry.get(normalizeMediaProviderId(id));
}
//#endregion
//#region src/media-understanding/provider-supports.ts
function providerSupportsCapability(provider, capability) {
	if (!provider) return false;
	if (capability === "audio") return Boolean(provider.transcribeAudio);
	if (capability === "image") return Boolean(provider.describeImage);
	return Boolean(provider.describeVideo);
}
//#endregion
//#region src/media-understanding/defaults.ts
const MB = 1024 * 1024;
const DEFAULT_MAX_CHARS = 500;
const DEFAULT_MAX_CHARS_BY_CAPABILITY = {
	image: 500,
	audio: void 0,
	video: 500
};
const DEFAULT_MAX_BYTES = {
	image: 10 * MB,
	audio: 20 * MB,
	video: 50 * MB
};
const DEFAULT_TIMEOUT_SECONDS = {
	image: 60,
	audio: 60,
	video: 120
};
const DEFAULT_PROMPT = {
	image: "Describe the image.",
	audio: "Transcribe the audio.",
	video: "Describe the video."
};
const DEFAULT_VIDEO_MAX_BASE64_BYTES = 70 * MB;
const CLI_OUTPUT_MAX_BUFFER = 5 * MB;
const DEFAULT_MEDIA_CONCURRENCY = 2;
let defaultRegistryCache = null;
const configRegistryCache = /* @__PURE__ */ new Map();
const MAX_CONFIG_REGISTRY_CACHE_ENTRIES = 32;
function cacheConfigRegistry(key, registry) {
	if (!configRegistryCache.has(key) && configRegistryCache.size >= MAX_CONFIG_REGISTRY_CACHE_ENTRIES) {
		const oldestKey = configRegistryCache.keys().next().value;
		if (oldestKey) configRegistryCache.delete(oldestKey);
	}
	configRegistryCache.set(key, registry);
	return registry;
}
function resolveDefaultRegistry(cfg) {
	if (!cfg) {
		defaultRegistryCache ??= buildMediaUnderstandingManifestMetadataRegistry();
		return defaultRegistryCache;
	}
	const cacheKey = resolveRuntimeConfigCacheKey(cfg);
	const cached = configRegistryCache.get(cacheKey);
	if (cached) return cached;
	return cacheConfigRegistry(cacheKey, buildMediaUnderstandingManifestMetadataRegistry(cfg));
}
function providerHasDeclaredCapability(provider, capability) {
	return provider?.capabilities?.includes(capability) ?? providerSupportsCapability(provider, capability);
}
function resolveConfiguredImageProviderModel(params) {
	const providers = params.cfg?.models?.providers;
	if (!providers || typeof providers !== "object") return;
	const normalizedProviderId = normalizeMediaProviderId(params.providerId);
	for (const [providerKey, providerCfg] of Object.entries(providers)) {
		if (normalizeMediaProviderId(providerKey) !== normalizedProviderId) continue;
		return normalizeOptionalString((providerCfg?.models ?? []).find((model) => Boolean(normalizeOptionalString(model?.id)) && Array.isArray(model?.input) && model.input.includes("image"))?.id);
	}
}
function resolveConfiguredImageProviderIds(cfg) {
	const providers = cfg?.models?.providers;
	if (!providers || typeof providers !== "object") return [];
	const configured = [];
	for (const [providerKey, providerCfg] of Object.entries(providers)) {
		const normalizedProviderId = normalizeMediaProviderId(providerKey);
		if (!normalizedProviderId || configured.includes(normalizedProviderId)) continue;
		if ((providerCfg?.models ?? []).some((model) => Array.isArray(model?.input) && model.input.includes("image"))) configured.push(normalizedProviderId);
	}
	return configured;
}
function resolveDefaultMediaModel(params) {
	if (!params.providerRegistry) {
		const configuredImageModel = params.capability === "image" ? resolveConfiguredImageProviderModel({
			cfg: params.cfg,
			providerId: params.providerId
		}) : void 0;
		if (configuredImageModel) return configuredImageModel;
	}
	return normalizeOptionalString((params.providerRegistry ?? resolveDefaultRegistry(params.cfg)).get(normalizeMediaProviderId(params.providerId))?.defaultModels?.[params.capability]);
}
function resolveAutoMediaKeyProviders(params) {
	const prioritized = [...(params.providerRegistry ?? resolveDefaultRegistry(params.cfg)).values()].filter((provider) => providerHasDeclaredCapability(provider, params.capability)).map((provider) => {
		const priority = provider.autoPriority?.[params.capability];
		return typeof priority === "number" && Number.isFinite(priority) ? {
			provider,
			priority
		} : null;
	}).filter((entry) => entry !== null).toSorted((left, right) => {
		if (left.priority !== right.priority) return left.priority - right.priority;
		return left.provider.id.localeCompare(right.provider.id);
	}).map((entry) => normalizeMediaProviderId(entry.provider.id)).filter(Boolean);
	if (params.providerRegistry || params.capability !== "image") return prioritized;
	return [...new Set([...prioritized, ...resolveConfiguredImageProviderIds(params.cfg)])];
}
function providerSupportsNativePdfDocument(params) {
	return (params.providerRegistry ?? resolveDefaultRegistry(params.cfg)).get(normalizeMediaProviderId(params.providerId))?.nativeDocumentInputs?.includes("pdf") ?? false;
}
/**
* Minimum audio file size in bytes below which transcription is skipped.
* Files smaller than this threshold are almost certainly empty or corrupt
* and would cause unhelpful API errors from Whisper/transcription providers.
*/
const MIN_AUDIO_FILE_BYTES = 1024;
//#endregion
export { DEFAULT_MEDIA_CONCURRENCY as a, DEFAULT_VIDEO_MAX_BASE64_BYTES as c, resolveAutoMediaKeyProviders as d, resolveDefaultMediaModel as f, getMediaUnderstandingProvider as h, DEFAULT_MAX_CHARS_BY_CAPABILITY as i, MIN_AUDIO_FILE_BYTES as l, buildMediaUnderstandingRegistry as m, DEFAULT_MAX_BYTES as n, DEFAULT_PROMPT as o, providerSupportsCapability as p, DEFAULT_MAX_CHARS as r, DEFAULT_TIMEOUT_SECONDS as s, CLI_OUTPUT_MAX_BUFFER as t, providerSupportsNativePdfDocument as u };
