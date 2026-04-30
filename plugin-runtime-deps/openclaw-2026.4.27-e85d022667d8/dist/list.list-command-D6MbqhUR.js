import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-Bje8XVt9.js";
import { r as theme, t as colorize } from "./theme-B128avno.js";
import { t as sanitizeTerminalText } from "./safe-text-BuwPGyoq.js";
import { r as writeRuntimeJson } from "./runtime-CIJX7ulQ.js";
import { n as DEFAULT_MODEL, r as DEFAULT_PROVIDER } from "./defaults-WmkV2Z8L.js";
import { n as resolveAgentModelPrimaryValue, t as resolveAgentModelFallbackValues } from "./model-input-Ba1eTv7s.js";
import { _ as resolveModelRefFromString, i as buildModelAliasIndex, m as resolveConfiguredModelRef, x as parseModelRef, y as modelKey } from "./model-selection-shared-BAGl40FK.js";
import "./model-selection-DGI1ibK2.js";
import { i as formatTokenK, n as ensureFlagCompatibility } from "./shared-YnyPjxBf.js";
import { n as loadModelsConfigWithSource } from "./load-config-BQIV37cV.js";
import { n as formatErrorWithStack } from "./list.errors-Cb2-g_BR.js";
import { i as truncate, n as isRich, r as pad, t as formatTag } from "./list.format-DDJtfv8A.js";
//#region src/commands/models/list.configured.ts
const DISPLAY_MODEL_PARSE_OPTIONS$1 = { allowPluginNormalization: false };
function resolveConfiguredEntries(cfg) {
	const resolvedDefault = resolveConfiguredModelRef({
		cfg,
		defaultProvider: DEFAULT_PROVIDER,
		defaultModel: DEFAULT_MODEL,
		...DISPLAY_MODEL_PARSE_OPTIONS$1
	});
	const aliasIndex = buildModelAliasIndex({
		cfg,
		defaultProvider: DEFAULT_PROVIDER,
		...DISPLAY_MODEL_PARSE_OPTIONS$1
	});
	const order = [];
	const tagsByKey = /* @__PURE__ */ new Map();
	const aliasesByKey = /* @__PURE__ */ new Map();
	for (const [key, aliases] of aliasIndex.byKey.entries()) aliasesByKey.set(key, aliases);
	const addEntry = (ref, tag) => {
		const key = modelKey(ref.provider, ref.model);
		if (!tagsByKey.has(key)) {
			tagsByKey.set(key, /* @__PURE__ */ new Set());
			order.push(key);
		}
		tagsByKey.get(key)?.add(tag);
	};
	const addResolvedModelRef = (raw, tag) => {
		const resolved = resolveModelRefFromString({
			raw,
			defaultProvider: DEFAULT_PROVIDER,
			aliasIndex,
			...DISPLAY_MODEL_PARSE_OPTIONS$1
		});
		if (resolved) addEntry(resolved.ref, tag);
	};
	addEntry(resolvedDefault, "default");
	const modelFallbacks = resolveAgentModelFallbackValues(cfg.agents?.defaults?.model);
	const imageFallbacks = resolveAgentModelFallbackValues(cfg.agents?.defaults?.imageModel);
	const imagePrimary = resolveAgentModelPrimaryValue(cfg.agents?.defaults?.imageModel) ?? "";
	modelFallbacks.forEach((raw, idx) => {
		addResolvedModelRef(raw, `fallback#${idx + 1}`);
	});
	if (imagePrimary) addResolvedModelRef(imagePrimary, "image");
	imageFallbacks.forEach((raw, idx) => {
		addResolvedModelRef(raw, `img-fallback#${idx + 1}`);
	});
	for (const key of Object.keys(cfg.agents?.defaults?.models ?? {})) {
		const parsed = parseModelRef(key, DEFAULT_PROVIDER, DISPLAY_MODEL_PARSE_OPTIONS$1);
		if (!parsed) continue;
		addEntry(parsed, "configured");
	}
	return { entries: order.map((key) => {
		const slash = key.indexOf("/");
		return {
			key,
			ref: {
				provider: slash === -1 ? key : key.slice(0, slash),
				model: slash === -1 ? "" : key.slice(slash + 1)
			},
			tags: tagsByKey.get(key) ?? /* @__PURE__ */ new Set(),
			aliases: aliasesByKey.get(key) ?? []
		};
	}) };
}
//#endregion
//#region src/commands/models/list.table.ts
const MODEL_PAD = 42;
const INPUT_PAD = 10;
const CTX_PAD = 11;
const LOCAL_PAD = 5;
const AUTH_PAD = 5;
function formatContextLabel(row) {
	if (typeof row.contextTokens === "number" && Number.isFinite(row.contextTokens) && row.contextTokens > 0 && row.contextTokens !== row.contextWindow) return `${formatTokenK(row.contextTokens)}/${formatTokenK(row.contextWindow)}`;
	return formatTokenK(row.contextWindow);
}
function printModelTable(rows, runtime, opts = {}) {
	if (opts.json) {
		writeRuntimeJson(runtime, {
			count: rows.length,
			models: rows
		});
		return;
	}
	if (opts.plain) {
		for (const row of rows) runtime.log(sanitizeTerminalText(row.key));
		return;
	}
	const rich = isRich(opts);
	const header = [
		pad("Model", MODEL_PAD),
		pad("Input", INPUT_PAD),
		pad("Ctx", CTX_PAD),
		pad("Local", LOCAL_PAD),
		pad("Auth", AUTH_PAD),
		"Tags"
	].join(" ");
	runtime.log(rich ? theme.heading(header) : header);
	for (const row of rows) {
		const keyLabel = pad(truncate(sanitizeTerminalText(row.key), MODEL_PAD), MODEL_PAD);
		const inputLabel = pad(sanitizeTerminalText(row.input) || "-", INPUT_PAD);
		const ctxLabel = pad(formatContextLabel(row), CTX_PAD);
		const localLabel = pad(row.local === null ? "-" : row.local ? "yes" : "no", LOCAL_PAD);
		const authLabel = pad(row.available === null ? "-" : row.available ? "yes" : "no", AUTH_PAD);
		const tags = row.tags.map(sanitizeTerminalText);
		const tagsLabel = tags.length > 0 ? rich ? tags.map((tag) => formatTag(tag, rich)).join(",") : tags.join(",") : "";
		const coloredInput = colorize(rich, row.input.includes("image") ? theme.accentBright : theme.info, inputLabel);
		const coloredLocal = colorize(rich, row.local === null ? theme.muted : row.local ? theme.success : theme.muted, localLabel);
		const coloredAuth = colorize(rich, row.available === null ? theme.muted : row.available ? theme.success : theme.error, authLabel);
		const line = [
			rich ? theme.accent(keyLabel) : keyLabel,
			coloredInput,
			ctxLabel,
			coloredLocal,
			coloredAuth,
			tagsLabel
		].join(" ");
		runtime.log(line);
	}
}
//#endregion
//#region src/commands/models/list.list-command.ts
const DISPLAY_MODEL_PARSE_OPTIONS = { allowPluginNormalization: false };
let registryLoadModulePromise;
let rowSourcesModulePromise;
let sourcePlanModulePromise;
function loadRegistryLoadModule() {
	registryLoadModulePromise ??= import("./list.registry-load-wGwe4iQr.js");
	return registryLoadModulePromise;
}
function loadRowSourcesModule() {
	rowSourcesModulePromise ??= import("./list.row-sources-BgnD8yZG.js");
	return rowSourcesModulePromise;
}
function loadSourcePlanModule() {
	sourcePlanModulePromise ??= import("./list.source-plan-aWzH7mXj.js");
	return sourcePlanModulePromise;
}
async function modelsListCommand(opts, runtime) {
	ensureFlagCompatibility(opts);
	const providerFilter = (() => {
		const raw = opts.provider?.trim();
		if (!raw) return;
		if (/\s/u.test(raw)) {
			runtime.error(`Invalid provider filter "${raw}". Use a provider id such as "moonshot", not a display label.`);
			process.exitCode = 1;
			return null;
		}
		return parseModelRef(`${raw}/_`, "openai", DISPLAY_MODEL_PARSE_OPTIONS)?.provider ?? normalizeLowercaseStringOrEmpty(raw);
	})();
	if (providerFilter === null) return;
	const [{ loadAuthProfileStoreWithoutExternalProfiles }, { resolveOpenClawAgentDir }] = await Promise.all([import("./store-C504fyiR.js"), import("./agent-paths-QpwbIBw9.js")]);
	const { resolvedConfig: cfg } = await loadModelsConfigWithSource({
		commandName: "models list",
		runtime
	});
	const authStore = loadAuthProfileStoreWithoutExternalProfiles();
	const agentDir = resolveOpenClawAgentDir();
	let modelRegistry;
	let registryModels = [];
	let discoveredKeys = /* @__PURE__ */ new Set();
	let availableKeys;
	let availabilityErrorMessage;
	const { entries } = resolveConfiguredEntries(cfg);
	const configuredByKey = new Map(entries.map((entry) => [entry.key, entry]));
	const sourcePlanModule = opts.all ? await loadSourcePlanModule() : void 0;
	const sourcePlan = sourcePlanModule ? await sourcePlanModule.planAllModelListSources({
		all: opts.all,
		providerFilter,
		cfg
	}) : void 0;
	const shouldLoadRegistry = sourcePlan?.requiresInitialRegistry ?? false;
	const loadRegistryState = async () => {
		const { loadListModelRegistry } = await loadRegistryLoadModule();
		const loaded = await loadListModelRegistry(cfg, {
			providerFilter,
			normalizeModels: Boolean(providerFilter)
		});
		modelRegistry = loaded.registry;
		registryModels = loaded.models;
		discoveredKeys = loaded.discoveredKeys;
		availableKeys = loaded.availableKeys;
		availabilityErrorMessage = loaded.availabilityErrorMessage;
	};
	try {
		if (shouldLoadRegistry) await loadRegistryState();
		else if (!opts.all && opts.local) {
			const { loadConfiguredListModelRegistry } = await loadRegistryLoadModule();
			const loaded = loadConfiguredListModelRegistry(cfg, entries, { providerFilter });
			modelRegistry = loaded.registry;
			discoveredKeys = loaded.discoveredKeys;
			availableKeys = loaded.availableKeys;
		}
	} catch (err) {
		runtime.error(`Model registry unavailable:\n${formatErrorWithStack(err)}`);
		process.exitCode = 1;
		return;
	}
	const buildRowContext = (skipRuntimeModelSuppression) => ({
		cfg,
		agentDir,
		authStore,
		availableKeys,
		configuredByKey,
		discoveredKeys,
		filter: {
			provider: providerFilter,
			local: opts.local
		},
		skipRuntimeModelSuppression
	});
	const rows = [];
	if (opts.all) {
		const { appendAllModelRowSources } = await loadRowSourcesModule();
		if (!sourcePlan || !sourcePlanModule) throw new Error("models list source plan was not initialized");
		let rowContext = buildRowContext(sourcePlan.skipRuntimeModelSuppression);
		if ((await appendAllModelRowSources({
			rows,
			context: rowContext,
			modelRegistry,
			registryModels,
			sourcePlan
		})).requiresRegistryFallback) {
			try {
				await loadRegistryState();
			} catch (err) {
				runtime.error(`Model registry unavailable:\n${formatErrorWithStack(err)}`);
				process.exitCode = 1;
				return;
			}
			rows.length = 0;
			rowContext = buildRowContext(false);
			await appendAllModelRowSources({
				rows,
				context: rowContext,
				modelRegistry,
				registryModels,
				sourcePlan: sourcePlanModule.createRegistryModelListSourcePlan()
			});
		}
	} else {
		const { appendConfiguredModelRowSources } = await loadRowSourcesModule();
		await appendConfiguredModelRowSources({
			rows,
			entries,
			modelRegistry,
			context: buildRowContext(!modelRegistry)
		});
	}
	if (availabilityErrorMessage !== void 0) runtime.error(`Model availability lookup failed; falling back to auth heuristics for discovered models: ${availabilityErrorMessage}`);
	if (rows.length === 0) {
		runtime.log("No models found.");
		return;
	}
	printModelTable(rows, runtime, opts);
}
//#endregion
export { modelsListCommand };
