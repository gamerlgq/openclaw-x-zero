import { t as resolveOpenClawAgentDir } from "./agent-paths-B_wzQ6Ed.js";
import { y as modelKey } from "./model-selection-shared-BAGl40FK.js";
import "./synthetic-auth.runtime-DBJFqg3m.js";
import { i as discoverModels, r as discoverAuthStorage } from "./pi-model-discovery-ChfcOXRA.js";
import "./profile-list-DRJDaM7Y.js";
import "./model-auth-CsyLGY9m.js";
import { n as shouldSuppressBuiltInModel, r as shouldSuppressBuiltInModelFromManifest } from "./model-suppression-CAyZcZMx.js";
import "./shared-YnyPjxBf.js";
import { n as formatErrorWithStack, r as shouldFallbackToAuthHeuristics, t as MODEL_AVAILABILITY_UNAVAILABLE_CODE } from "./list.errors-Cb2-g_BR.js";
import "./list.model-row-DLGaEAZc.js";
//#region src/commands/models/list.registry.ts
function createAvailabilityUnavailableError(message) {
	const err = new Error(message);
	err.code = MODEL_AVAILABILITY_UNAVAILABLE_CODE;
	return err;
}
function normalizeAvailabilityError(err) {
	if (shouldFallbackToAuthHeuristics(err) && err instanceof Error) return err;
	return createAvailabilityUnavailableError(`Model availability unavailable: getAvailable() failed.\n${formatErrorWithStack(err)}`);
}
function validateAvailableModels(availableModels) {
	if (!Array.isArray(availableModels)) throw createAvailabilityUnavailableError("Model availability unavailable: getAvailable() returned a non-array value.");
	for (const model of availableModels) if (!model || typeof model !== "object" || typeof model.provider !== "string" || typeof model.id !== "string") throw createAvailabilityUnavailableError("Model availability unavailable: getAvailable() returned invalid model entries.");
	return availableModels;
}
function loadAvailableModels(registry, cfg, opts) {
	let availableModels;
	try {
		availableModels = registry.getAvailable();
	} catch (err) {
		throw normalizeAvailabilityError(err);
	}
	try {
		return validateAvailableModels(availableModels).filter((model) => opts?.runtimeSuppression === false ? !shouldSuppressBuiltInModelFromManifest({
			provider: model.provider,
			id: model.id,
			config: cfg
		}) : !shouldSuppressBuiltInModel({
			provider: model.provider,
			id: model.id,
			baseUrl: model.baseUrl,
			config: cfg
		}));
	} catch (err) {
		throw normalizeAvailabilityError(err);
	}
}
async function loadModelRegistry(cfg, opts) {
	const runtimeSuppression = opts?.normalizeModels !== false;
	const agentDir = resolveOpenClawAgentDir();
	const registry = discoverModels(discoverAuthStorage(agentDir, { readOnly: true }), agentDir, {
		providerFilter: opts?.providerFilter,
		normalizeModels: opts?.normalizeModels
	});
	const models = registry.getAll().filter((model) => runtimeSuppression ? !shouldSuppressBuiltInModel({
		provider: model.provider,
		id: model.id,
		baseUrl: model.baseUrl,
		config: cfg
	}) : !shouldSuppressBuiltInModelFromManifest({
		provider: model.provider,
		id: model.id,
		config: cfg
	}));
	let availableKeys;
	let availabilityErrorMessage;
	try {
		const availableModels = loadAvailableModels(registry, cfg, { runtimeSuppression });
		availableKeys = new Set(availableModels.map((model) => modelKey(model.provider, model.id)));
	} catch (err) {
		if (!shouldFallbackToAuthHeuristics(err)) throw err;
		availableKeys = void 0;
		if (!availabilityErrorMessage) availabilityErrorMessage = formatErrorWithStack(err);
	}
	return {
		registry,
		models,
		availableKeys,
		availabilityErrorMessage
	};
}
//#endregion
//#region src/commands/models/list.registry-load.ts
async function loadListModelRegistry(cfg, opts) {
	const loaded = await loadModelRegistry(cfg, opts);
	return {
		...loaded,
		discoveredKeys: new Set(loaded.models.map((model) => modelKey(model.provider, model.id)))
	};
}
function findConfiguredRegistryModel(params) {
	const model = params.registry.find(params.entry.ref.provider, params.entry.ref.model);
	if (!model) return;
	if (shouldSuppressBuiltInModel({
		provider: model.provider,
		id: model.id,
		baseUrl: model.baseUrl,
		config: params.cfg
	})) return;
	return model;
}
function loadConfiguredListModelRegistry(cfg, entries, opts) {
	const agentDir = resolveOpenClawAgentDir();
	const registry = discoverModels(discoverAuthStorage(agentDir, { readOnly: true }), agentDir, { providerFilter: opts?.providerFilter });
	const discoveredKeys = /* @__PURE__ */ new Set();
	const availableKeys = /* @__PURE__ */ new Set();
	for (const entry of entries) {
		const model = findConfiguredRegistryModel({
			registry,
			entry,
			cfg
		});
		if (!model) continue;
		const key = modelKey(model.provider, model.id);
		discoveredKeys.add(key);
		if (registry.hasConfiguredAuth(model)) availableKeys.add(key);
	}
	return {
		registry,
		discoveredKeys,
		availableKeys
	};
}
//#endregion
export { loadConfiguredListModelRegistry, loadListModelRegistry };
