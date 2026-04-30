import { s as normalizeOptionalLowercaseString } from "./string-coerce-Bje8XVt9.js";
import { n as resolveBundledPluginsDir } from "./bundled-dir-BdVWKJP0.js";
import { i as loadPluginManifest } from "./manifest-BRvO4Lcw.js";
import { o as normalizePluginsConfig } from "./config-state-cB4SZz9a.js";
import { i as passesManifestOwnerBasePolicy } from "./manifest-owner-policy-BHUJ11vd.js";
import { i as listPotentialConfiguredChannelIds, r as listExplicitlyDisabledChannelIdsForConfig } from "./config-presence-DFxkfI9g.js";
import { t as applyPluginAutoEnable } from "./plugin-auto-enable-DzWJedM7.js";
import { a as resolveGatewayStartupPluginIds, d as listExplicitConfiguredChannelIdsForConfig, f as resolveConfiguredChannelPluginIds } from "./gateway-startup-plugin-ids-BthrJK4f.js";
import "./channel-plugin-ids-Bwb66ujx.js";
import fs from "node:fs";
import path from "node:path";
//#region src/plugins/effective-plugin-ids.ts
function collectConfiguredChannelIds(config, activationSourceConfig, env) {
	const disabled = new Set([...listExplicitlyDisabledChannelIdsForConfig(config), ...listExplicitlyDisabledChannelIdsForConfig(activationSourceConfig)]);
	return [...new Set([...listPotentialConfiguredChannelIds(config, env, { includePersistedAuthState: false }), ...listExplicitConfiguredChannelIdsForConfig(activationSourceConfig)])].map((channelId) => normalizeOptionalLowercaseString(channelId)).filter((channelId) => {
		if (!channelId) return false;
		return !disabled.has(channelId);
	}).toSorted((left, right) => left.localeCompare(right));
}
function collectBundledChannelOwnerPluginIds(params) {
	const plugins = normalizePluginsConfig(params.config.plugins);
	const channelIds = new Set(params.channelIds.map((channelId) => normalizeOptionalLowercaseString(channelId)).filter((channelId) => Boolean(channelId)));
	if (channelIds.size === 0) return [];
	const bundledDir = resolveBundledPluginsDir(params.env);
	if (!bundledDir) return [];
	let entries;
	try {
		entries = fs.readdirSync(bundledDir, { withFileTypes: true });
	} catch {
		return [];
	}
	const pluginIds = /* @__PURE__ */ new Set();
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const manifest = loadPluginManifest(path.join(bundledDir, entry.name), false);
		if (!manifest.ok) continue;
		if ((manifest.manifest.channels ?? []).some((channelId) => channelIds.has(normalizeOptionalLowercaseString(channelId) ?? ""))) {
			const pluginId = normalizeOptionalLowercaseString(manifest.manifest.id);
			if (pluginId && passesManifestOwnerBasePolicy({
				plugin: { id: pluginId },
				normalizedConfig: plugins,
				allowRestrictiveAllowlistBypass: true
			})) pluginIds.add(pluginId);
		}
	}
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
function collectExplicitEffectivePluginIds(config) {
	const plugins = normalizePluginsConfig(config.plugins);
	if (!plugins.enabled) return [];
	const ids = new Set(plugins.allow);
	for (const [pluginId, entry] of Object.entries(plugins.entries)) if (entry?.enabled === true && (plugins.allow.length === 0 || plugins.allow.includes(pluginId))) ids.add(pluginId);
	for (const pluginId of plugins.deny) ids.delete(pluginId);
	for (const [pluginId, entry] of Object.entries(plugins.entries)) if (entry?.enabled === false) ids.delete(pluginId);
	return [...ids].toSorted((left, right) => left.localeCompare(right));
}
function resolveEffectivePluginIds(params) {
	const effectiveConfig = applyPluginAutoEnable({
		config: params.config,
		env: params.env
	}).config;
	const ids = new Set(collectExplicitEffectivePluginIds(effectiveConfig));
	const configuredChannelIds = collectConfiguredChannelIds(effectiveConfig, params.config, params.env);
	for (const pluginId of resolveConfiguredChannelPluginIds({
		config: effectiveConfig,
		activationSourceConfig: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	})) ids.add(pluginId);
	for (const pluginId of collectBundledChannelOwnerPluginIds({
		config: effectiveConfig,
		channelIds: configuredChannelIds,
		env: params.env
	})) ids.add(pluginId);
	for (const pluginId of resolveGatewayStartupPluginIds({
		config: effectiveConfig,
		activationSourceConfig: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	})) ids.add(pluginId);
	return [...ids].toSorted((left, right) => left.localeCompare(right));
}
//#endregion
export { resolveEffectivePluginIds as t };
