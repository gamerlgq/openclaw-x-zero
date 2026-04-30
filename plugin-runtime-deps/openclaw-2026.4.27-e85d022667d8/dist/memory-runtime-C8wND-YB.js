import { o as normalizePluginsConfig } from "./config-state-cB4SZz9a.js";
import { a as resolveRuntimePluginRegistry } from "./loader-CPsG_3Jg.js";
import { o as getMemoryRuntime } from "./memory-state-MIj6In9p.js";
import { i as resolvePluginRuntimeLoadContext, t as buildPluginRuntimeLoadOptions } from "./load-context-C8ndVB-2.js";
//#region src/plugins/memory-runtime.ts
function resolveMemoryRuntimePluginIds(config) {
	const memorySlot = normalizePluginsConfig(config.plugins).slots.memory;
	return typeof memorySlot === "string" && memorySlot.trim().length > 0 ? [memorySlot] : [];
}
function ensureMemoryRuntime(cfg) {
	const current = getMemoryRuntime();
	if (current || !cfg) return current;
	const context = resolvePluginRuntimeLoadContext({ config: cfg });
	const onlyPluginIds = resolveMemoryRuntimePluginIds(context.config);
	if (onlyPluginIds.length === 0) return getMemoryRuntime();
	resolveRuntimePluginRegistry(buildPluginRuntimeLoadOptions(context, { onlyPluginIds }));
	return getMemoryRuntime();
}
async function getActiveMemorySearchManager(params) {
	const runtime = ensureMemoryRuntime(params.cfg);
	if (!runtime) return {
		manager: null,
		error: "memory plugin unavailable"
	};
	return await runtime.getMemorySearchManager(params);
}
function resolveActiveMemoryBackendConfig(params) {
	return ensureMemoryRuntime(params.cfg)?.resolveMemoryBackendConfig(params) ?? null;
}
async function closeActiveMemorySearchManagers(cfg) {
	await getMemoryRuntime()?.closeAllMemorySearchManagers?.();
}
//#endregion
export { getActiveMemorySearchManager as n, resolveActiveMemoryBackendConfig as r, closeActiveMemorySearchManagers as t };
