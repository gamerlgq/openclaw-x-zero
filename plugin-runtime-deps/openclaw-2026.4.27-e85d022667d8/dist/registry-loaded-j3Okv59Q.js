import { c as normalizeOptionalString } from "./string-coerce-Bje8XVt9.js";
import { n as CHAT_CHANNEL_ORDER } from "./ids-B-sRTG6a.js";
import { n as getActivePluginChannelRegistryVersionFromState, t as getActivePluginChannelRegistryFromState } from "./runtime-channel-state-Cn3rRGfn.js";
import "./registry-C85w3UMa.js";
//#region src/channels/plugins/registry-loaded.ts
let cachedChannelPlugins = {
	registryVersion: -1,
	registryRef: null,
	sorted: [],
	byId: /* @__PURE__ */ new Map(),
	entriesById: /* @__PURE__ */ new Map()
};
function coerceLoadedChannelPlugin(plugin) {
	const id = normalizeOptionalString(plugin?.id) ?? "";
	if (!plugin || !id) return null;
	if (!plugin.meta || typeof plugin.meta !== "object") plugin.meta = {};
	return plugin;
}
function dedupeChannels(channels) {
	const seen = /* @__PURE__ */ new Set();
	const resolved = [];
	for (const plugin of channels) {
		const id = normalizeOptionalString(plugin.id) ?? "";
		if (!id || seen.has(id)) continue;
		seen.add(id);
		resolved.push(plugin);
	}
	return resolved;
}
function resolveCachedChannelPlugins() {
	const registry = getActivePluginChannelRegistryFromState();
	const registryVersion = getActivePluginChannelRegistryVersionFromState();
	const cached = cachedChannelPlugins;
	if (cached.registryVersion === registryVersion && cached.registryRef === registry) return cached;
	const channelPlugins = [];
	const pluginEntries = [];
	if (registry && Array.isArray(registry.channels)) for (const entry of registry.channels) {
		const plugin = coerceLoadedChannelPlugin(entry?.plugin);
		if (plugin) {
			channelPlugins.push(plugin);
			pluginEntries.push({
				...entry,
				plugin
			});
		}
	}
	const sorted = dedupeChannels(channelPlugins).toSorted((a, b) => {
		const indexA = CHAT_CHANNEL_ORDER.indexOf(a.id);
		const indexB = CHAT_CHANNEL_ORDER.indexOf(b.id);
		const orderA = a.meta.order ?? (indexA === -1 ? 999 : indexA);
		const orderB = b.meta.order ?? (indexB === -1 ? 999 : indexB);
		if (orderA !== orderB) return orderA - orderB;
		return a.id.localeCompare(b.id);
	});
	const byId = /* @__PURE__ */ new Map();
	const entriesById = /* @__PURE__ */ new Map();
	const unsortedEntriesById = new Map(pluginEntries.map((entry) => [entry.plugin.id, entry]));
	for (const plugin of sorted) {
		byId.set(plugin.id, plugin);
		const entry = unsortedEntriesById.get(plugin.id);
		if (entry) entriesById.set(plugin.id, entry);
	}
	const next = {
		registryVersion,
		registryRef: registry,
		sorted,
		byId,
		entriesById
	};
	cachedChannelPlugins = next;
	return next;
}
function listLoadedChannelPlugins() {
	return resolveCachedChannelPlugins().sorted.slice();
}
function getLoadedChannelPluginById(id) {
	const resolvedId = normalizeOptionalString(id) ?? "";
	if (!resolvedId) return;
	return resolveCachedChannelPlugins().byId.get(resolvedId);
}
function getLoadedChannelPluginEntryById(id) {
	const resolvedId = normalizeOptionalString(id) ?? "";
	if (!resolvedId) return;
	return resolveCachedChannelPlugins().entriesById.get(resolvedId);
}
//#endregion
export { getLoadedChannelPluginEntryById as n, listLoadedChannelPlugins as r, getLoadedChannelPluginById as t };
