import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-Bje8XVt9.js";
import { p as resolveUserPath } from "./utils-DvkbxKCZ.js";
import { c as normalizeAgentId } from "./session-key-C6F-NnIG.js";
import { S as resolveDefaultAgentId, _ as listAgentIds, g as listAgentEntries, x as resolveAgentWorkspaceDir } from "./agent-scope-RNt6KatQ.js";
import { t as parseDurationMs } from "./parse-duration-sSTfcZq4.js";
import { t as CANONICAL_ROOT_MEMORY_FILENAME } from "./root-memory-files-YefKNHwl.js";
import { t as splitShellArgs } from "./shell-argv-C9NFzxGp.js";
import { n as getActiveMemorySearchManager } from "./memory-runtime-C8wND-YB.js";
import { t as resolveMemorySearchConfig } from "./memory-search-CwVTNndi.js";
import fs from "node:fs";
import path from "node:path";
//#region src/memory-host-sdk/host/backend-config.ts
const DEFAULT_BACKEND = "builtin";
const DEFAULT_CITATIONS = "auto";
const DEFAULT_QMD_INTERVAL = "5m";
const DEFAULT_QMD_DEBOUNCE_MS = 15e3;
const DEFAULT_QMD_TIMEOUT_MS = 4e3;
const DEFAULT_QMD_SEARCH_MODE = "search";
const DEFAULT_QMD_EMBED_INTERVAL = "60m";
const DEFAULT_QMD_COMMAND_TIMEOUT_MS = 3e4;
const DEFAULT_QMD_UPDATE_TIMEOUT_MS = 12e4;
const DEFAULT_QMD_EMBED_TIMEOUT_MS = 12e4;
const DEFAULT_QMD_LIMITS = {
	maxResults: 4,
	maxSnippetChars: 450,
	maxInjectedChars: 2200,
	timeoutMs: DEFAULT_QMD_TIMEOUT_MS
};
const DEFAULT_QMD_MCPORTER = {
	enabled: false,
	serverName: "qmd",
	startDaemon: true
};
const DEFAULT_QMD_SCOPE = {
	default: "deny",
	rules: [{
		action: "allow",
		match: { chatType: "direct" }
	}, {
		action: "allow",
		match: { chatType: "channel" }
	}]
};
function sanitizeName(input) {
	return normalizeLowercaseStringOrEmpty(input).replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "collection";
}
function scopeCollectionBase(base, agentId) {
	return `${base}-${sanitizeName(agentId)}`;
}
function canonicalizePathForContainment(rawPath) {
	const resolved = path.resolve(rawPath);
	let current = resolved;
	const suffix = [];
	while (true) try {
		const canonical = path.normalize(fs.realpathSync.native(current));
		return path.normalize(path.join(canonical, ...suffix));
	} catch {
		const parent = path.dirname(current);
		if (parent === current) return path.normalize(resolved);
		suffix.unshift(path.basename(current));
		current = parent;
	}
}
function isPathInsideRoot(candidatePath, rootPath) {
	const relative = path.relative(canonicalizePathForContainment(rootPath), canonicalizePathForContainment(candidatePath));
	return relative === "" || !relative.startsWith("..") && !path.isAbsolute(relative);
}
function ensureUniqueName(base, existing) {
	let name = sanitizeName(base);
	if (!existing.has(name)) {
		existing.add(name);
		return name;
	}
	let suffix = 2;
	while (existing.has(`${name}-${suffix}`)) suffix += 1;
	const unique = `${name}-${suffix}`;
	existing.add(unique);
	return unique;
}
function resolvePath(raw, workspaceDir) {
	const trimmed = raw.trim();
	if (!trimmed) throw new Error("path required");
	if (trimmed.startsWith("~") || path.isAbsolute(trimmed)) return path.normalize(resolveUserPath(trimmed));
	return path.normalize(path.resolve(workspaceDir, trimmed));
}
function resolveIntervalMs(raw) {
	const value = raw?.trim();
	if (!value) return parseDurationMs(DEFAULT_QMD_INTERVAL, { defaultUnit: "m" });
	try {
		return parseDurationMs(value, { defaultUnit: "m" });
	} catch {
		return parseDurationMs(DEFAULT_QMD_INTERVAL, { defaultUnit: "m" });
	}
}
function resolveEmbedIntervalMs(raw) {
	const value = raw?.trim();
	if (!value) return parseDurationMs(DEFAULT_QMD_EMBED_INTERVAL, { defaultUnit: "m" });
	try {
		return parseDurationMs(value, { defaultUnit: "m" });
	} catch {
		return parseDurationMs(DEFAULT_QMD_EMBED_INTERVAL, { defaultUnit: "m" });
	}
}
function resolveDebounceMs(raw) {
	if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
	return DEFAULT_QMD_DEBOUNCE_MS;
}
function resolveTimeoutMs(raw, fallback) {
	if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
	return fallback;
}
function resolveLimits(raw) {
	const parsed = { ...DEFAULT_QMD_LIMITS };
	if (raw?.maxResults && raw.maxResults > 0) parsed.maxResults = Math.floor(raw.maxResults);
	if (raw?.maxSnippetChars && raw.maxSnippetChars > 0) parsed.maxSnippetChars = Math.floor(raw.maxSnippetChars);
	if (raw?.maxInjectedChars && raw.maxInjectedChars > 0) parsed.maxInjectedChars = Math.floor(raw.maxInjectedChars);
	if (raw?.timeoutMs && raw.timeoutMs > 0) parsed.timeoutMs = Math.floor(raw.timeoutMs);
	return parsed;
}
function resolveSearchMode(raw) {
	if (raw === "search" || raw === "vsearch" || raw === "query") return raw;
	return DEFAULT_QMD_SEARCH_MODE;
}
function resolveSearchTool(raw) {
	const value = raw?.trim();
	return value ? value : void 0;
}
function resolveSessionConfig(cfg, workspaceDir) {
	const enabled = Boolean(cfg?.enabled);
	const exportDirRaw = cfg?.exportDir?.trim();
	return {
		enabled,
		exportDir: exportDirRaw ? resolvePath(exportDirRaw, workspaceDir) : void 0,
		retentionDays: cfg?.retentionDays && cfg.retentionDays > 0 ? Math.floor(cfg.retentionDays) : void 0
	};
}
function resolveCustomPaths(rawPaths, workspaceDir, existing, agentId) {
	if (!rawPaths?.length) return [];
	const collections = [];
	const seenRoots = /* @__PURE__ */ new Set();
	rawPaths.forEach((entry, index) => {
		const trimmedPath = normalizeOptionalString(entry?.path);
		if (!trimmedPath) return;
		let resolved;
		try {
			resolved = resolvePath(trimmedPath, workspaceDir);
		} catch {
			return;
		}
		const pattern = normalizeOptionalString(entry.pattern) || "**/*.md";
		const dedupeKey = `${resolved}\u0000${pattern}`;
		if (seenRoots.has(dedupeKey)) return;
		seenRoots.add(dedupeKey);
		const explicitName = entry.name?.trim();
		const name = ensureUniqueName(explicitName && !isPathInsideRoot(resolved, workspaceDir) ? explicitName : scopeCollectionBase(explicitName || `custom-${index + 1}`, agentId), existing);
		collections.push({
			name,
			path: resolved,
			pattern,
			kind: "custom"
		});
	});
	return collections;
}
function resolveMcporterConfig(raw) {
	const parsed = { ...DEFAULT_QMD_MCPORTER };
	if (!raw) return parsed;
	if (raw.enabled !== void 0) parsed.enabled = raw.enabled;
	if (typeof raw.serverName === "string" && raw.serverName.trim()) parsed.serverName = raw.serverName.trim();
	if (raw.startDaemon !== void 0) parsed.startDaemon = raw.startDaemon;
	if (parsed.enabled && raw.startDaemon === void 0) parsed.startDaemon = true;
	return parsed;
}
function resolveDefaultCollections(include, workspaceDir, existing, agentId) {
	if (!include) return [];
	return [{
		path: workspaceDir,
		pattern: CANONICAL_ROOT_MEMORY_FILENAME,
		base: "memory-root"
	}, {
		path: path.join(workspaceDir, "memory"),
		pattern: "**/*.md",
		base: "memory-dir"
	}].map((entry) => ({
		name: ensureUniqueName(scopeCollectionBase(entry.base, agentId), existing),
		path: entry.path,
		pattern: entry.pattern,
		kind: "memory"
	}));
}
function resolveMemoryBackendConfig(params) {
	const normalizedAgentId = normalizeAgentId(params.agentId);
	const backend = params.cfg.memory?.backend ?? DEFAULT_BACKEND;
	const citations = params.cfg.memory?.citations ?? DEFAULT_CITATIONS;
	if (backend !== "qmd") return {
		backend: "builtin",
		citations
	};
	const workspaceDir = resolveAgentWorkspaceDir(params.cfg, normalizedAgentId);
	const qmdCfg = params.cfg.memory?.qmd;
	const includeDefaultMemory = qmdCfg?.includeDefaultMemory !== false;
	const nameSet = /* @__PURE__ */ new Set();
	const agentEntry = params.cfg.agents?.list?.find((entry) => normalizeAgentId(entry?.id) === normalizedAgentId);
	const mergedExtraPaths = [...params.cfg.agents?.defaults?.memorySearch?.extraPaths ?? [], ...agentEntry?.memorySearch?.extraPaths ?? []].filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean);
	const searchExtraPaths = Array.from(new Set(mergedExtraPaths)).map((pathValue) => ({ path: pathValue }));
	const mergedExtraCollections = [...params.cfg.agents?.defaults?.memorySearch?.qmd?.extraCollections ?? [], ...agentEntry?.memorySearch?.qmd?.extraCollections ?? []].filter((value) => value !== null && typeof value === "object" && typeof value.path === "string");
	const allQmdPaths = [
		...qmdCfg?.paths ?? [],
		...searchExtraPaths,
		...mergedExtraCollections
	];
	const collections = [...resolveDefaultCollections(includeDefaultMemory, workspaceDir, nameSet, normalizedAgentId), ...resolveCustomPaths(allQmdPaths, workspaceDir, nameSet, normalizedAgentId)];
	const rawCommand = normalizeOptionalString(qmdCfg?.command) || "qmd";
	return {
		backend: "qmd",
		citations,
		qmd: {
			command: splitShellArgs(rawCommand)?.[0] || rawCommand.split(/\s+/)[0] || "qmd",
			mcporter: resolveMcporterConfig(qmdCfg?.mcporter),
			searchMode: resolveSearchMode(qmdCfg?.searchMode),
			searchTool: resolveSearchTool(qmdCfg?.searchTool),
			collections,
			includeDefaultMemory,
			sessions: resolveSessionConfig(qmdCfg?.sessions, workspaceDir),
			update: {
				intervalMs: resolveIntervalMs(qmdCfg?.update?.interval),
				debounceMs: resolveDebounceMs(qmdCfg?.update?.debounceMs),
				onBoot: qmdCfg?.update?.onBoot !== false,
				waitForBootSync: qmdCfg?.update?.waitForBootSync === true,
				embedIntervalMs: resolveEmbedIntervalMs(qmdCfg?.update?.embedInterval),
				commandTimeoutMs: resolveTimeoutMs(qmdCfg?.update?.commandTimeoutMs, DEFAULT_QMD_COMMAND_TIMEOUT_MS),
				updateTimeoutMs: resolveTimeoutMs(qmdCfg?.update?.updateTimeoutMs, DEFAULT_QMD_UPDATE_TIMEOUT_MS),
				embedTimeoutMs: resolveTimeoutMs(qmdCfg?.update?.embedTimeoutMs, DEFAULT_QMD_EMBED_TIMEOUT_MS)
			},
			limits: resolveLimits(qmdCfg?.limits),
			scope: qmdCfg?.scope ?? DEFAULT_QMD_SCOPE
		}
	};
}
//#endregion
//#region src/gateway/server-startup-memory.ts
function shouldRunQmdStartupBootSync(qmd) {
	return qmd.update.onBoot;
}
function hasExplicitAgentMemorySearchConfig(cfg, agentId) {
	return listAgentEntries(cfg).some((entry) => normalizeAgentId(entry.id) === agentId && entry.memorySearch != null);
}
function shouldEagerlyStartAgentMemory(params) {
	if (params.agentCount <= 1) return true;
	if (params.agentId === resolveDefaultAgentId(params.cfg)) return true;
	if (params.cfg.agents?.defaults?.memorySearch?.enabled === true) return true;
	return hasExplicitAgentMemorySearchConfig(params.cfg, params.agentId);
}
async function startGatewayMemoryBackend(params) {
	const agentIds = listAgentIds(params.cfg);
	const armedAgentIds = [];
	const deferredAgentIds = [];
	for (const agentId of agentIds) {
		if (!resolveMemorySearchConfig(params.cfg, agentId)) continue;
		const resolved = resolveMemoryBackendConfig({
			cfg: params.cfg,
			agentId
		});
		if (!resolved) continue;
		if (resolved.backend !== "qmd" || !resolved.qmd) continue;
		if (!shouldRunQmdStartupBootSync(resolved.qmd)) continue;
		if (!shouldEagerlyStartAgentMemory({
			cfg: params.cfg,
			agentId,
			agentCount: agentIds.length
		})) {
			deferredAgentIds.push(agentId);
			continue;
		}
		const { manager, error } = await getActiveMemorySearchManager({
			cfg: params.cfg,
			agentId,
			purpose: "cli"
		});
		if (!manager) {
			params.log.warn(`qmd memory startup initialization failed for agent "${agentId}": ${error ?? "unknown error"}`);
			continue;
		}
		try {
			await manager.sync?.({
				reason: "boot",
				force: true
			});
		} catch (err) {
			params.log.warn(`qmd memory startup boot sync failed for agent "${agentId}": ${String(err)}`);
			continue;
		} finally {
			await manager.close?.().catch((err) => {
				params.log.warn(`qmd memory startup manager close failed for agent "${agentId}": ${String(err)}`);
			});
		}
		armedAgentIds.push(agentId);
	}
	if (armedAgentIds.length > 0) params.log.info?.(`qmd memory startup boot sync completed for ${formatAgentCount(armedAgentIds.length)}: ${armedAgentIds.map((agentId) => `"${agentId}"`).join(", ")}`);
	if (deferredAgentIds.length > 0) params.log.info?.(`qmd memory startup initialization deferred for ${formatAgentCount(deferredAgentIds.length)}: ${deferredAgentIds.map((agentId) => `"${agentId}"`).join(", ")}`);
}
function formatAgentCount(count) {
	return count === 1 ? "1 agent" : `${count} agents`;
}
//#endregion
export { startGatewayMemoryBackend };
