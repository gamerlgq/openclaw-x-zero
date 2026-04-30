import { s as normalizeOptionalLowercaseString } from "./string-coerce-Bje8XVt9.js";
import { r as resolveHomeRelativePath } from "./home-dir-g5LU3LmA.js";
import { _ as resolveStateDir } from "./paths-B2cMK-wd.js";
import { t as createNpmProjectInstallEnv } from "./npm-install-env-C21A_tiW.js";
import { t as sanitizeTerminalText } from "./safe-text-BuwPGyoq.js";
import { n as beginBundledRuntimeDepsInstall } from "./bundled-runtime-deps-activity-DWqaJIdp.js";
import { o as normalizePluginsConfig } from "./config-state-cB4SZz9a.js";
import { i as passesManifestOwnerBasePolicy } from "./manifest-owner-policy-BHUJ11vd.js";
import { Module, createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
function finiteNonNegativeNumber(value) {
	const numberValue = Number(value);
	return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}
function findExistingDiskSpacePath(targetPath) {
	let current = path.resolve(targetPath);
	while (true) try {
		return fs.statSync(current).isDirectory() ? current : path.dirname(current);
	} catch {
		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}
function tryReadDiskSpace(targetPath) {
	if (typeof fs.statfsSync !== "function") return null;
	const checkedPath = findExistingDiskSpacePath(targetPath);
	if (!checkedPath) return null;
	try {
		const stats = fs.statfsSync(checkedPath);
		const blockSize = finiteNonNegativeNumber(stats.bsize);
		const availableBlocks = finiteNonNegativeNumber(stats.bavail);
		if (blockSize === null || availableBlocks === null) return null;
		const totalBlocks = finiteNonNegativeNumber(stats.blocks);
		return {
			targetPath,
			checkedPath,
			availableBytes: blockSize * availableBlocks,
			totalBytes: totalBlocks === null ? null : blockSize * totalBlocks
		};
	} catch {
		return null;
	}
}
function formatDiskSpaceBytes(bytes) {
	const mib = bytes / (1024 * 1024);
	if (mib < 1024) return `${Math.max(0, Math.round(mib))} MiB`;
	const gib = mib / 1024;
	return `${gib.toFixed(gib < 10 ? 1 : 0)} GiB`;
}
function createLowDiskSpaceWarning(params) {
	const thresholdBytes = params.thresholdBytes ?? 1073741824;
	const snapshot = tryReadDiskSpace(params.targetPath);
	if (!snapshot || snapshot.availableBytes >= thresholdBytes) return null;
	return `Low disk space near ${path.resolve(snapshot.targetPath) === path.resolve(snapshot.checkedPath) ? snapshot.checkedPath : `${snapshot.targetPath} (volume checked at ${snapshot.checkedPath})`}: ${formatDiskSpaceBytes(snapshot.availableBytes)} available; ${params.purpose} may fail.`;
}
//#endregion
//#region src/plugins/semver.runtime.ts
const semver = createRequire(import.meta.url)("semver");
const satisfies = (version, range, options) => semver.satisfies(version, range, options);
const validSemver = (version) => semver.valid(version);
const validRange = (range) => semver.validRange(range);
//#endregion
//#region src/plugins/bundled-runtime-deps.ts
const RETAINED_RUNTIME_DEPS_MANIFEST = ".openclaw-runtime-deps.json";
const PLUGIN_ROOT_INSTALL_STAGE_DIR = ".openclaw-install-stage";
const BUNDLED_RUNTIME_DEPS_LOCK_DIR = ".openclaw-runtime-deps.lock";
const BUNDLED_RUNTIME_DEPS_LOCK_OWNER_FILE = "owner.json";
const BUNDLED_RUNTIME_DEPS_LOCK_WAIT_MS = 100;
const BUNDLED_RUNTIME_DEPS_LOCK_TIMEOUT_MS = 5 * 6e4;
const BUNDLED_RUNTIME_DEPS_LOCK_STALE_MS = 10 * 6e4;
const BUNDLED_RUNTIME_DEPS_OWNERLESS_LOCK_STALE_MS = 3e4;
const BUNDLED_RUNTIME_DEPS_INSTALL_PROGRESS_INTERVAL_MS = 5e3;
const BUNDLED_RUNTIME_MIRROR_MATERIALIZED_EXTENSIONS = new Set([
	".cjs",
	".js",
	".mjs"
]);
const BUNDLED_EXTENSION_DIST_DIR = "extensions";
const MIRRORED_CORE_RUNTIME_DEP_NAMES = ["semver", "tslog"];
const MIRRORED_PACKAGE_RUNTIME_DEP_PLUGIN_ID = "openclaw-core";
const BUNDLED_RUNTIME_MIRROR_PLUGIN_REGION_RE = /(?:^|\n)\/\/#region extensions\/[^/\s]+(?:\/|$)/u;
const BUNDLED_RUNTIME_MIRROR_IMPORT_SPECIFIER_RE = /(?:^|[;\n])\s*(?:import|export)\s+(?:[^'"()]+?\s+from\s+)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)|\brequire\(\s*["']([^"']+)["']\s*\)/g;
const registeredBundledRuntimeDepNodePaths = /* @__PURE__ */ new Set();
const bundledRuntimeMirrorMaterializeCache = /* @__PURE__ */ new Map();
const rootDistMirroredRuntimeDepsCache = /* @__PURE__ */ new Map();
function statSignature(stat) {
	return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}`;
}
function computeBundledRuntimeMirrorDistFileMaterialization(sourcePath) {
	let source;
	try {
		source = fs.readFileSync(sourcePath, "utf8");
	} catch {
		return false;
	}
	if (BUNDLED_RUNTIME_MIRROR_PLUGIN_REGION_RE.test(source)) return true;
	for (const match of source.matchAll(BUNDLED_RUNTIME_MIRROR_IMPORT_SPECIFIER_RE)) {
		const specifier = match[1] ?? match[2] ?? match[3] ?? "";
		if (specifier !== "" && !specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("node:") && !specifier.includes(":")) return false;
	}
	return true;
}
function shouldMaterializeBundledRuntimeMirrorDistFile(sourcePath) {
	if (!BUNDLED_RUNTIME_MIRROR_MATERIALIZED_EXTENSIONS.has(path.extname(sourcePath))) return false;
	const cacheKey = path.resolve(sourcePath);
	let signature;
	try {
		signature = statSignature(fs.statSync(sourcePath));
	} catch {
		bundledRuntimeMirrorMaterializeCache.delete(cacheKey);
		return false;
	}
	const cached = bundledRuntimeMirrorMaterializeCache.get(cacheKey);
	if (cached?.signature === signature) return cached.materialize;
	const materialize = computeBundledRuntimeMirrorDistFileMaterialization(sourcePath);
	bundledRuntimeMirrorMaterializeCache.set(cacheKey, {
		signature,
		materialize
	});
	return materialize;
}
function materializeBundledRuntimeMirrorDistFile(sourcePath, targetPath) {
	if (path.resolve(sourcePath) === path.resolve(targetPath)) return;
	try {
		const targetStat = fs.lstatSync(targetPath);
		if (fs.realpathSync(sourcePath) === fs.realpathSync(targetPath) && !targetStat.isSymbolicLink()) return;
	} catch {}
	fs.mkdirSync(path.dirname(targetPath), {
		recursive: true,
		mode: 493
	});
	fs.rmSync(targetPath, {
		recursive: true,
		force: true
	});
	try {
		fs.linkSync(sourcePath, targetPath);
		return;
	} catch {
		fs.copyFileSync(sourcePath, targetPath);
	}
	try {
		const sourceMode = fs.statSync(sourcePath).mode;
		fs.chmodSync(targetPath, sourceMode | 384);
	} catch {}
}
const BUNDLED_RUNTIME_DEP_SEGMENT_RE = /^[a-z0-9][a-z0-9._-]*$/;
function normalizeInstallableRuntimeDepName(rawName) {
	const depName = rawName.trim();
	if (depName === "") return null;
	const segments = depName.split("/");
	if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) return null;
	if (segments.length === 1) return BUNDLED_RUNTIME_DEP_SEGMENT_RE.test(segments[0] ?? "") ? depName : null;
	if (segments.length !== 2 || !segments[0]?.startsWith("@")) return null;
	const scope = segments[0].slice(1);
	const packageName = segments[1];
	return BUNDLED_RUNTIME_DEP_SEGMENT_RE.test(scope) && BUNDLED_RUNTIME_DEP_SEGMENT_RE.test(packageName ?? "") ? depName : null;
}
function normalizeInstallableRuntimeDepVersion(rawVersion) {
	if (typeof rawVersion !== "string") return null;
	const version = rawVersion.trim();
	if (version === "" || version.toLowerCase().startsWith("workspace:")) return null;
	if (validSemver(version)) return version;
	const rangePrefix = version[0];
	if ((rangePrefix === "^" || rangePrefix === "~") && validSemver(version.slice(1))) return version;
	return null;
}
function parseInstallableRuntimeDep(name, rawVersion) {
	if (typeof rawVersion !== "string") return null;
	const version = rawVersion.trim();
	if (version === "" || version.toLowerCase().startsWith("workspace:")) return null;
	const normalizedName = normalizeInstallableRuntimeDepName(name);
	if (!normalizedName) throw new Error(`Invalid bundled runtime dependency name: ${name}`);
	const normalizedVersion = normalizeInstallableRuntimeDepVersion(version);
	if (!normalizedVersion) throw new Error(`Unsupported bundled runtime dependency spec for ${normalizedName}: ${version}`);
	return {
		name: normalizedName,
		version: normalizedVersion
	};
}
function parseInstallableRuntimeDepSpec(spec) {
	const atIndex = spec.lastIndexOf("@");
	if (atIndex <= 0 || atIndex === spec.length - 1) throw new Error(`Invalid bundled runtime dependency install spec: ${spec}`);
	const parsed = parseInstallableRuntimeDep(spec.slice(0, atIndex), spec.slice(atIndex + 1));
	if (!parsed) throw new Error(`Invalid bundled runtime dependency install spec: ${spec}`);
	return parsed;
}
function dependencySentinelPath(depName) {
	const normalizedDepName = normalizeInstallableRuntimeDepName(depName);
	if (!normalizedDepName) throw new Error(`Invalid bundled runtime dependency name: ${depName}`);
	return path.join("node_modules", ...normalizedDepName.split("/"), "package.json");
}
function resolveDependencySentinelAbsolutePath(rootDir, depName) {
	const nodeModulesDir = path.resolve(rootDir, "node_modules");
	const sentinelPath = path.resolve(rootDir, dependencySentinelPath(depName));
	if (sentinelPath !== nodeModulesDir && !sentinelPath.startsWith(`${nodeModulesDir}${path.sep}`)) throw new Error(`Blocked runtime dependency path escape for ${depName}`);
	return sentinelPath;
}
function readInstalledDependencyVersion(rootDir, depName) {
	const parsed = readJsonObject(resolveDependencySentinelAbsolutePath(rootDir, depName));
	return (parsed && typeof parsed.version === "string" ? parsed.version.trim() : "") || null;
}
function readJsonObject(filePath) {
	try {
		const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}
function sleepSync(ms) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
async function sleep(ms) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}
function isProcessAlive(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return error.code === "EPERM";
	}
}
function readRuntimeDepsLockOwner(lockDir) {
	const ownerFilePath = path.join(lockDir, BUNDLED_RUNTIME_DEPS_LOCK_OWNER_FILE);
	let owner = null;
	let ownerFileState = "missing";
	let ownerFileMtimeMs;
	let ownerFileIsSymlink;
	try {
		const ownerFileStat = fs.lstatSync(ownerFilePath);
		ownerFileMtimeMs = ownerFileStat.mtimeMs;
		ownerFileIsSymlink = ownerFileStat.isSymbolicLink();
	} catch {}
	try {
		const parsed = JSON.parse(fs.readFileSync(ownerFilePath, "utf8"));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			owner = parsed;
			ownerFileState = "ok";
		} else ownerFileState = "invalid";
	} catch (error) {
		ownerFileState = error.code === "ENOENT" && ownerFileMtimeMs === void 0 ? "missing" : "invalid";
	}
	let lockDirMtimeMs;
	try {
		lockDirMtimeMs = fs.statSync(lockDir).mtimeMs;
	} catch {}
	return {
		pid: typeof owner?.pid === "number" ? owner.pid : void 0,
		createdAtMs: typeof owner?.createdAtMs === "number" ? owner.createdAtMs : void 0,
		ownerFileState,
		ownerFilePath,
		ownerFileMtimeMs,
		ownerFileIsSymlink,
		lockDirMtimeMs
	};
}
function latestFiniteMs(values) {
	let latest;
	for (const value of values) {
		if (typeof value !== "number" || !Number.isFinite(value)) continue;
		if (latest === void 0 || value > latest) latest = value;
	}
	return latest;
}
function shouldRemoveRuntimeDepsLock(owner, nowMs, isAlive = isProcessAlive) {
	if (typeof owner.pid === "number") return !isAlive(owner.pid);
	if (typeof owner.createdAtMs === "number") return nowMs - owner.createdAtMs > BUNDLED_RUNTIME_DEPS_LOCK_STALE_MS;
	const ownerlessObservedAtMs = latestFiniteMs([owner.lockDirMtimeMs, owner.ownerFileMtimeMs]);
	return typeof ownerlessObservedAtMs === "number" && nowMs - ownerlessObservedAtMs > BUNDLED_RUNTIME_DEPS_OWNERLESS_LOCK_STALE_MS;
}
function formatDurationMs(ms) {
	return typeof ms === "number" && Number.isFinite(ms) ? `${Math.max(0, Math.round(ms))}ms` : "n/a";
}
function formatRuntimeDepsLockTimeoutMessage(params) {
	const ownerAgeMs = typeof params.owner.createdAtMs === "number" ? params.nowMs - params.owner.createdAtMs : void 0;
	const lockAgeMs = typeof params.owner.lockDirMtimeMs === "number" ? params.nowMs - params.owner.lockDirMtimeMs : void 0;
	const ownerFileAgeMs = typeof params.owner.ownerFileMtimeMs === "number" ? params.nowMs - params.owner.ownerFileMtimeMs : void 0;
	const pidDetail = typeof params.owner.pid === "number" ? `pid=${params.owner.pid} alive=${isProcessAlive(params.owner.pid)}` : "pid=missing";
	const ownerFileSymlink = typeof params.owner.ownerFileIsSymlink === "boolean" ? params.owner.ownerFileIsSymlink : "n/a";
	return `Timed out waiting for bundled runtime deps lock at ${params.lockDir} (waited=${formatDurationMs(params.waitedMs)}, ownerFile=${params.owner.ownerFileState}, ownerFileSymlink=${ownerFileSymlink}, ${pidDetail}, ownerAge=${formatDurationMs(ownerAgeMs)}, ownerFileAge=${formatDurationMs(ownerFileAgeMs)}, lockAge=${formatDurationMs(lockAgeMs)}, ownerFilePath=${params.owner.ownerFilePath}). If no OpenClaw/npm install is running, remove the lock directory and retry.`;
}
function removeRuntimeDepsLockIfStale(lockDir, nowMs) {
	if (!shouldRemoveRuntimeDepsLock(readRuntimeDepsLockOwner(lockDir), nowMs)) return false;
	try {
		fs.rmSync(lockDir, {
			recursive: true,
			force: true
		});
		return true;
	} catch {
		return false;
	}
}
function withBundledRuntimeDepsFilesystemLock(installRoot, lockName, run) {
	fs.mkdirSync(installRoot, { recursive: true });
	const lockDir = path.join(installRoot, lockName);
	const startedAt = Date.now();
	let locked = false;
	while (!locked) try {
		fs.mkdirSync(lockDir);
		try {
			fs.writeFileSync(path.join(lockDir, BUNDLED_RUNTIME_DEPS_LOCK_OWNER_FILE), `${JSON.stringify({
				pid: process.pid,
				createdAtMs: Date.now()
			}, null, 2)}\n`, "utf8");
		} catch (ownerWriteError) {
			fs.rmSync(lockDir, {
				recursive: true,
				force: true
			});
			throw ownerWriteError;
		}
		locked = true;
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		removeRuntimeDepsLockIfStale(lockDir, Date.now());
		const nowMs = Date.now();
		if (nowMs - startedAt > BUNDLED_RUNTIME_DEPS_LOCK_TIMEOUT_MS) throw new Error(formatRuntimeDepsLockTimeoutMessage({
			lockDir,
			owner: readRuntimeDepsLockOwner(lockDir),
			waitedMs: nowMs - startedAt,
			nowMs
		}), { cause: error });
		sleepSync(BUNDLED_RUNTIME_DEPS_LOCK_WAIT_MS);
	}
	try {
		return run();
	} finally {
		fs.rmSync(lockDir, {
			recursive: true,
			force: true
		});
	}
}
function withBundledRuntimeDepsInstallRootLock(installRoot, run) {
	return withBundledRuntimeDepsFilesystemLock(installRoot, BUNDLED_RUNTIME_DEPS_LOCK_DIR, run);
}
function collectRuntimeDeps(packageJson) {
	return {
		...packageJson.dependencies,
		...packageJson.optionalDependencies
	};
}
function collectMirroredPackageRuntimeDeps(packageRoot, ownerPluginIds) {
	if (!packageRoot) return [];
	const packageJson = readJsonObject(path.join(packageRoot, "package.json"));
	if (!packageJson) return [];
	const runtimeDeps = collectRuntimeDeps(packageJson);
	const coreRuntimeDeps = MIRRORED_CORE_RUNTIME_DEP_NAMES.flatMap((name) => {
		const dep = parseInstallableRuntimeDep(name, runtimeDeps[name]);
		return dep ? [{
			...dep,
			pluginIds: [MIRRORED_PACKAGE_RUNTIME_DEP_PLUGIN_ID]
		}] : [];
	});
	const rootDistDeps = collectRootDistMirroredRuntimeDepsCached({
		packageRoot,
		runtimeDeps
	}).filter((dep) => !ownerPluginIds || dep.pluginIds.some((pluginId) => ownerPluginIds.has(pluginId)));
	return mergeRuntimeDepEntries([...coreRuntimeDeps, ...rootDistDeps]);
}
function packageNameFromSpecifier(specifier) {
	if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:") || specifier.startsWith("#")) return null;
	const [first, second] = specifier.split("/");
	if (!first) return null;
	return first.startsWith("@") && second ? `${first}/${second}` : first;
}
function extractStaticRuntimeImportSpecifiers(source) {
	const specifiers = /* @__PURE__ */ new Set();
	for (const pattern of [
		/\bfrom\s*["']([^"']+)["']/g,
		/\bimport\s*["']([^"']+)["']/g,
		/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
		/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g
	]) for (const match of source.matchAll(pattern)) if (match[1]) specifiers.add(match[1]);
	return [...specifiers];
}
function walkRuntimeDistJavaScriptFiles(params) {
	if (!fs.existsSync(params.rootDir)) return [];
	const files = [];
	const queue = [params.rootDir];
	while (queue.length > 0) {
		const current = queue.shift();
		if (!current) continue;
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const fullPath = path.join(current, entry.name);
			if (entry.isDirectory()) {
				const isSkippedTopLevelDir = path.resolve(current) === path.resolve(params.rootDir) && params.skipTopLevelDirs?.has(entry.name);
				if (entry.name !== "node_modules" && !isSkippedTopLevelDir) queue.push(fullPath);
				continue;
			}
			if (entry.isFile() && BUNDLED_RUNTIME_MIRROR_MATERIALIZED_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
		}
	}
	return files.toSorted((left, right) => left.localeCompare(right));
}
function isPluginOwnedDistImporter(params) {
	return params.pluginIds.some((pluginId) => {
		const pluginPathPrefix = `${BUNDLED_EXTENSION_DIST_DIR}/${pluginId}/`;
		return params.relativePath.startsWith(pluginPathPrefix) || params.source.includes(`//#region ${pluginPathPrefix}`);
	});
}
function collectBundledRuntimeDependencyOwners(packageRoot) {
	const extensionsDir = path.join(packageRoot, "dist", "extensions");
	if (!fs.existsSync(extensionsDir)) return /* @__PURE__ */ new Map();
	const owners = /* @__PURE__ */ new Map();
	for (const entry of fs.readdirSync(extensionsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const pluginId = entry.name;
		const packageJson = readJsonObject(path.join(extensionsDir, pluginId, "package.json"));
		if (!packageJson) continue;
		for (const [name, rawVersion] of Object.entries(collectRuntimeDeps(packageJson))) {
			const dep = parseInstallableRuntimeDep(name, rawVersion);
			if (!dep) continue;
			const existing = owners.get(dep.name);
			if (existing) {
				existing.pluginIds = [...new Set([...existing.pluginIds, pluginId])].toSorted((left, right) => left.localeCompare(right));
				continue;
			}
			owners.set(dep.name, {
				...dep,
				pluginIds: [pluginId]
			});
		}
	}
	return owners;
}
function stringifyRuntimeDepsSignature(runtimeDeps) {
	return JSON.stringify(Object.entries(runtimeDeps).toSorted(([left], [right]) => left.localeCompare(right)));
}
function fileSignature(filePath) {
	try {
		return statSignature(fs.statSync(filePath));
	} catch {
		return "missing";
	}
}
function createPluginPackageSignature(extensionsDir) {
	if (!fs.existsSync(extensionsDir)) return "missing";
	return fs.readdirSync(extensionsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => {
		const packageJsonPath = path.join(extensionsDir, entry.name, "package.json");
		return `${entry.name}:${fileSignature(packageJsonPath)}`;
	}).toSorted((left, right) => left.localeCompare(right)).join("|");
}
function createRootDistMirroredRuntimeDepsCacheSignature(params) {
	const distDir = path.join(params.packageRoot, "dist");
	const extensionsDir = path.join(distDir, "extensions");
	return JSON.stringify({
		packageJson: fileSignature(path.join(params.packageRoot, "package.json")),
		dist: fileSignature(distDir),
		plugins: createPluginPackageSignature(extensionsDir),
		runtimeDeps: stringifyRuntimeDepsSignature(params.runtimeDeps)
	});
}
function cloneRuntimeDepEntries(deps) {
	return deps.map((dep) => ({
		...dep,
		pluginIds: [...dep.pluginIds]
	}));
}
function collectRootDistMirroredRuntimeDepsCached(params) {
	const cacheKey = path.resolve(params.packageRoot);
	const signature = createRootDistMirroredRuntimeDepsCacheSignature(params);
	const cached = rootDistMirroredRuntimeDepsCache.get(cacheKey);
	if (cached?.signature === signature) return cloneRuntimeDepEntries(cached.deps);
	const deps = collectRootDistMirroredRuntimeDeps(params);
	rootDistMirroredRuntimeDepsCache.set(cacheKey, {
		signature,
		deps: cloneRuntimeDepEntries(deps)
	});
	return deps;
}
function collectRootDistMirroredRuntimeDeps(params) {
	const dependencyOwners = collectBundledRuntimeDependencyOwners(params.packageRoot);
	if (dependencyOwners.size === 0) return [];
	const mirrored = /* @__PURE__ */ new Map();
	const distDir = path.join(params.packageRoot, "dist");
	for (const filePath of walkRuntimeDistJavaScriptFiles({
		rootDir: distDir,
		skipTopLevelDirs: new Set(["extensions"])
	})) {
		const source = fs.readFileSync(filePath, "utf8");
		const relativePath = path.relative(distDir, filePath).replaceAll(path.sep, "/");
		for (const specifier of extractStaticRuntimeImportSpecifiers(source)) {
			const dependencyName = packageNameFromSpecifier(specifier);
			if (!dependencyName) continue;
			const owner = dependencyOwners.get(dependencyName);
			if (!owner) continue;
			if (isPluginOwnedDistImporter({
				relativePath,
				source,
				pluginIds: owner.pluginIds
			})) continue;
			const dep = parseInstallableRuntimeDep(dependencyName, params.runtimeDeps[dependencyName]);
			if (dep) mirrored.set(dep.name, {
				...dep,
				pluginIds: owner.pluginIds
			});
		}
	}
	return [...mirrored.values()].toSorted((left, right) => {
		const nameOrder = left.name.localeCompare(right.name);
		return nameOrder === 0 ? left.version.localeCompare(right.version) : nameOrder;
	});
}
function mergeInstallableRuntimeDeps(deps) {
	const bySpec = /* @__PURE__ */ new Map();
	for (const dep of deps) bySpec.set(`${dep.name}@${dep.version}`, dep);
	return [...bySpec.values()].toSorted((left, right) => {
		const nameOrder = left.name.localeCompare(right.name);
		return nameOrder === 0 ? left.version.localeCompare(right.version) : nameOrder;
	});
}
function mergeRuntimeDepEntries(deps) {
	const bySpec = /* @__PURE__ */ new Map();
	for (const dep of deps) {
		const spec = `${dep.name}@${dep.version}`;
		const existing = bySpec.get(spec);
		if (!existing) {
			bySpec.set(spec, {
				...dep,
				pluginIds: [...dep.pluginIds]
			});
			continue;
		}
		existing.pluginIds = [...new Set([...existing.pluginIds, ...dep.pluginIds])].toSorted((left, right) => left.localeCompare(right));
	}
	return [...bySpec.values()].toSorted((left, right) => {
		const nameOrder = left.name.localeCompare(right.name);
		return nameOrder === 0 ? left.version.localeCompare(right.version) : nameOrder;
	});
}
function isSourceCheckoutRoot(packageRoot) {
	return (fs.existsSync(path.join(packageRoot, ".git")) || fs.existsSync(path.join(packageRoot, "pnpm-workspace.yaml"))) && fs.existsSync(path.join(packageRoot, "src")) && fs.existsSync(path.join(packageRoot, "extensions"));
}
function resolveSourceCheckoutBundledPluginPackageRoot(pluginRoot) {
	const extensionsDir = path.dirname(path.resolve(pluginRoot));
	if (path.basename(extensionsDir) !== "extensions") return null;
	const packageRoot = path.dirname(extensionsDir);
	return isSourceCheckoutRoot(packageRoot) ? packageRoot : null;
}
function resolveSourceCheckoutDistPackageRoot(pluginRoot) {
	const extensionsDir = path.dirname(pluginRoot);
	const buildDir = path.dirname(extensionsDir);
	if (path.basename(extensionsDir) !== "extensions" || path.basename(buildDir) !== "dist" && path.basename(buildDir) !== "dist-runtime") return null;
	const packageRoot = path.dirname(buildDir);
	return isSourceCheckoutRoot(packageRoot) ? packageRoot : null;
}
function resolveSourceCheckoutPackageRoot(pluginRoot) {
	return resolveSourceCheckoutBundledPluginPackageRoot(pluginRoot) ?? resolveSourceCheckoutDistPackageRoot(pluginRoot);
}
function resolveBundledPluginPackageRoot(pluginRoot) {
	const extensionsDir = path.dirname(path.resolve(pluginRoot));
	const buildDir = path.dirname(extensionsDir);
	if (path.basename(extensionsDir) !== "extensions" || path.basename(buildDir) !== "dist" && path.basename(buildDir) !== "dist-runtime") return null;
	return path.dirname(buildDir);
}
function resolveBundledRuntimeDependencyPackageRoot(pluginRoot) {
	return resolveBundledPluginPackageRoot(pluginRoot);
}
function registerBundledRuntimeDependencyNodePath(rootDir) {
	const nodeModulesDir = path.join(rootDir, "node_modules");
	if (registeredBundledRuntimeDepNodePaths.has(nodeModulesDir) || !fs.existsSync(nodeModulesDir)) return;
	const currentPaths = (process.env.NODE_PATH ?? "").split(path.delimiter).map((entry) => entry.trim()).filter((entry) => entry.length > 0);
	process.env.NODE_PATH = [nodeModulesDir, ...currentPaths.filter((entry) => entry !== nodeModulesDir)].join(path.delimiter);
	Module._initPaths?.();
	registeredBundledRuntimeDepNodePaths.add(nodeModulesDir);
}
function isPackagedBundledPluginRoot(pluginRoot) {
	const packageRoot = resolveBundledPluginPackageRoot(pluginRoot);
	return Boolean(packageRoot && !isSourceCheckoutRoot(packageRoot));
}
function createRuntimeDepsCacheKey(pluginId, specs) {
	return createHash("sha256").update(pluginId).update("\0").update(specs.join("\0")).digest("hex").slice(0, 16);
}
function createPathHash(value) {
	return createHash("sha256").update(path.resolve(value)).digest("hex").slice(0, 12);
}
function sanitizePathSegment(value) {
	return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}
function readPackageVersion(packageRoot) {
	const parsed = readJsonObject(path.join(packageRoot, "package.json"));
	return (parsed && typeof parsed.version === "string" ? parsed.version.trim() : "") || "unknown";
}
function readRetainedRuntimeDepsManifest(installRoot) {
	const specs = readJsonObject(path.join(installRoot, RETAINED_RUNTIME_DEPS_MANIFEST))?.specs;
	if (!Array.isArray(specs)) return [];
	return specs.filter((entry) => typeof entry === "string" && entry.trim().length > 0).toSorted((left, right) => left.localeCompare(right));
}
function writeRetainedRuntimeDepsManifest(installRoot, specs) {
	fs.mkdirSync(installRoot, { recursive: true });
	fs.writeFileSync(path.join(installRoot, RETAINED_RUNTIME_DEPS_MANIFEST), `${JSON.stringify({ specs: [...specs].toSorted((left, right) => left.localeCompare(right)) }, null, 2)}\n`, "utf8");
}
function removeRetainedRuntimeDepsManifest(installRoot) {
	fs.rmSync(path.join(installRoot, RETAINED_RUNTIME_DEPS_MANIFEST), { force: true });
}
function removeRuntimeDepPackageDir(rootDir, depName) {
	const packageDir = path.dirname(resolveDependencySentinelAbsolutePath(rootDir, depName));
	fs.rmSync(packageDir, {
		recursive: true,
		force: true
	});
	if (depName.startsWith("@")) try {
		const scopeDir = path.dirname(packageDir);
		if (fs.existsSync(scopeDir) && fs.readdirSync(scopeDir).length === 0) fs.rmdirSync(scopeDir);
	} catch {}
}
function pruneRetainedRuntimeDepsManifestSpecs(params) {
	if (params.previousSpecs.length === 0) return;
	const nextNames = new Set(params.nextSpecs.map((spec) => parseInstallableRuntimeDepSpec(spec).name));
	for (const spec of params.previousSpecs) {
		const dep = parseInstallableRuntimeDepSpec(spec);
		if (!nextNames.has(dep.name)) removeRuntimeDepPackageDir(params.installRoot, dep.name);
	}
}
function collectAlreadyStagedBundledRuntimeDepSpecs(params) {
	const packageRoot = resolveBundledPluginPackageRoot(params.pluginRoot);
	if (!packageRoot) return [];
	const extensionsDir = path.join(packageRoot, "dist", "extensions");
	if (!fs.existsSync(extensionsDir)) return [];
	const { deps, pluginIds } = collectBundledPluginRuntimeDeps({
		extensionsDir,
		config: params.config
	});
	const packageRuntimeDeps = pluginIds.length > 0 ? collectMirroredPackageRuntimeDeps(packageRoot, new Set(pluginIds)) : [];
	return mergeRuntimeDepEntries([...deps, ...packageRuntimeDeps]).filter((dep) => hasDependencySentinel([params.installRoot], dep)).map((dep) => `${dep.name}@${dep.version}`).toSorted((left, right) => left.localeCompare(right));
}
function shouldPersistRetainedRuntimeDepsManifest(params) {
	if (path.resolve(params.installRoot) !== path.resolve(params.pluginRoot)) return true;
	return !resolveSourceCheckoutPackageRoot(params.pluginRoot);
}
function isWritableDirectory(dir) {
	let probeDir = null;
	try {
		probeDir = fs.mkdtempSync(path.join(dir, ".openclaw-write-probe-"));
		fs.writeFileSync(path.join(probeDir, "probe"), "", "utf8");
		return true;
	} catch {
		return false;
	} finally {
		if (probeDir) try {
			fs.rmSync(probeDir, {
				recursive: true,
				force: true
			});
		} catch {}
	}
}
function resolveSystemdStateDirectory(env) {
	const raw = env.STATE_DIRECTORY?.trim();
	if (!raw) return null;
	const first = raw.split(path.delimiter).find((entry) => entry.trim().length > 0);
	return first ? path.resolve(first) : null;
}
function resolveBundledRuntimeDepsExternalBaseDirs(env) {
	const explicit = env.OPENCLAW_PLUGIN_STAGE_DIR?.trim();
	if (explicit) {
		const roots = explicit.split(path.delimiter).map((entry) => entry.trim()).filter((entry) => entry.length > 0).map((entry) => path.resolve(resolveHomeRelativePath(entry, {
			env,
			homedir: os.homedir
		})));
		if (roots.length > 0) {
			const uniqueRoots = [];
			for (const root of roots) {
				const existingIndex = uniqueRoots.findIndex((entry) => path.resolve(entry) === path.resolve(root));
				if (existingIndex >= 0) uniqueRoots.splice(existingIndex, 1);
				uniqueRoots.push(root);
			}
			return uniqueRoots;
		}
	}
	const systemdStateDir = resolveSystemdStateDirectory(env);
	if (systemdStateDir) return [path.join(systemdStateDir, "plugin-runtime-deps")];
	return [path.join(resolveStateDir(env, os.homedir), "plugin-runtime-deps")];
}
function resolveExternalBundledRuntimeDepsInstallRoot(params) {
	return resolveExternalBundledRuntimeDepsInstallRoots(params).at(-1);
}
function resolveExternalBundledRuntimeDepsInstallRoots(params) {
	const packageRoot = resolveBundledPluginPackageRoot(params.pluginRoot) ?? params.pluginRoot;
	const existingExternalRoots = resolveExistingExternalBundledRuntimeDepsRoots({
		packageRoot,
		env: params.env
	});
	if (existingExternalRoots) return existingExternalRoots;
	const packageKey = `openclaw-${sanitizePathSegment(readPackageVersion(packageRoot))}-${createPathHash(packageRoot)}`;
	return resolveBundledRuntimeDepsExternalBaseDirs(params.env).map((baseDir) => path.join(baseDir, packageKey));
}
function resolveExistingExternalBundledRuntimeDepsRoots(params) {
	const packageRoot = path.resolve(params.packageRoot);
	const externalBaseDirs = resolveBundledRuntimeDepsExternalBaseDirs(params.env);
	for (const externalBaseDir of externalBaseDirs) {
		const relative = path.relative(path.resolve(externalBaseDir), packageRoot);
		if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) continue;
		const packageKey = relative.split(path.sep)[0];
		if (!packageKey || !packageKey.startsWith("openclaw-")) continue;
		return externalBaseDirs.map((baseDir) => path.join(baseDir, packageKey));
	}
	return null;
}
function resolveSourceCheckoutRuntimeDepsCacheDir(params) {
	const packageRoot = resolveSourceCheckoutPackageRoot(params.pluginRoot);
	if (!packageRoot) return null;
	return path.join(packageRoot, ".local", "bundled-plugin-runtime-deps", `${params.pluginId}-${createRuntimeDepsCacheKey(params.pluginId, params.installSpecs)}`);
}
function hasAllDependencySentinels(rootDir, deps) {
	return deps.every((dep) => fs.existsSync(path.join(rootDir, dependencySentinelPath(dep.name))));
}
function isInstalledDependencyVersionSatisfied(installedVersion, spec) {
	const normalizedInstalledVersion = validSemver(installedVersion);
	const normalizedRange = validRange(spec);
	if (normalizedInstalledVersion && normalizedRange) return satisfies(normalizedInstalledVersion, normalizedRange, { includePrerelease: true });
	return installedVersion === spec;
}
function hasDependencySentinel(searchRoots, dep) {
	return searchRoots.some((rootDir) => {
		const installedVersion = readInstalledDependencyVersion(rootDir, dep.name);
		return typeof installedVersion === "string" && isInstalledDependencyVersionSatisfied(installedVersion, dep.version);
	});
}
function findDependencySentinelRoot(searchRoots, dep) {
	return searchRoots.find((rootDir) => {
		const installedVersion = readInstalledDependencyVersion(rootDir, dep.name);
		return typeof installedVersion === "string" && isInstalledDependencyVersionSatisfied(installedVersion, dep.version);
	}) ?? null;
}
function dependencyPackageDir(rootDir, depName) {
	const normalizedDepName = normalizeInstallableRuntimeDepName(depName);
	if (!normalizedDepName) throw new Error(`Invalid bundled runtime dependency name: ${depName}`);
	return path.join(rootDir, "node_modules", ...normalizedDepName.split("/"));
}
function createBundledRuntimeDepsInstallRootPlan(params) {
	const searchRoots = [];
	for (const root of params.searchRoots) {
		const resolved = path.resolve(root);
		if (!searchRoots.some((entry) => path.resolve(entry) === resolved)) searchRoots.push(root);
	}
	if (!searchRoots.some((entry) => path.resolve(entry) === path.resolve(params.installRoot))) searchRoots.push(params.installRoot);
	return {
		installRoot: params.installRoot,
		searchRoots,
		external: params.external
	};
}
function createBundledRuntimeDepsWritableInstallSpecs(params) {
	const readOnlyRoots = params.searchRoots.filter((rootDir) => path.resolve(rootDir) !== path.resolve(params.installRoot));
	return params.deps.filter((dep) => !hasDependencySentinel(readOnlyRoots, dep)).map((dep) => `${dep.name}@${dep.version}`).toSorted((left, right) => left.localeCompare(right));
}
function linkBundledRuntimeDepsFromSearchRoots(params) {
	for (const dep of params.deps) {
		if (hasDependencySentinel([params.installRoot], dep)) continue;
		const sourceRoot = findDependencySentinelRoot(params.searchRoots, dep);
		if (!sourceRoot || path.resolve(sourceRoot) === path.resolve(params.installRoot)) continue;
		const sourceDir = dependencyPackageDir(sourceRoot, dep.name);
		const targetDir = dependencyPackageDir(params.installRoot, dep.name);
		fs.mkdirSync(path.dirname(targetDir), { recursive: true });
		fs.rmSync(targetDir, {
			recursive: true,
			force: true
		});
		try {
			fs.symlinkSync(sourceDir, targetDir, process.platform === "win32" ? "junction" : "dir");
		} catch {
			fs.cpSync(sourceDir, targetDir, { recursive: true });
		}
	}
}
function assertBundledRuntimeDepsInstalled(rootDir, specs) {
	const missingSpecs = specs.filter((spec) => {
		const dep = parseInstallableRuntimeDepSpec(spec);
		return !hasDependencySentinel([rootDir], dep);
	});
	if (missingSpecs.length === 0) return;
	throw new Error(`npm install did not place bundled runtime deps in ${rootDir}: ${missingSpecs.join(", ")}`);
}
function replaceNodeModulesDir(targetDir, sourceDir) {
	const parentDir = path.dirname(targetDir);
	const tempDir = fs.mkdtempSync(path.join(parentDir, ".openclaw-runtime-deps-copy-"));
	const stagedDir = path.join(tempDir, "node_modules");
	try {
		fs.cpSync(sourceDir, stagedDir, { recursive: true });
		fs.rmSync(targetDir, {
			recursive: true,
			force: true
		});
		fs.renameSync(stagedDir, targetDir);
	} finally {
		try {
			fs.rmSync(tempDir, {
				recursive: true,
				force: true
			});
		} catch {}
	}
}
function linkNodeModulesDir(targetDir, sourceDir) {
	const parentDir = path.dirname(targetDir);
	const tempLink = path.join(parentDir, `.openclaw-runtime-deps-link-${process.pid}-${Date.now()}`);
	try {
		fs.symlinkSync(sourceDir, tempLink, process.platform === "win32" ? "junction" : "dir");
		fs.rmSync(targetDir, {
			recursive: true,
			force: true
		});
		fs.renameSync(tempLink, targetDir);
		return true;
	} catch {
		try {
			fs.rmSync(tempLink, {
				recursive: true,
				force: true
			});
		} catch {}
		return false;
	}
}
function replaceNodeModulesDirFromCache(targetDir, sourceDir) {
	if (linkNodeModulesDir(targetDir, sourceDir)) return;
	replaceNodeModulesDir(targetDir, sourceDir);
}
function restoreSourceCheckoutRuntimeDepsFromCache(params) {
	if (!params.cacheDir) return false;
	const cachedNodeModulesDir = path.join(params.cacheDir, "node_modules");
	if (!hasAllDependencySentinels(params.cacheDir, params.deps)) return false;
	try {
		replaceNodeModulesDirFromCache(path.join(params.installRoot, "node_modules"), cachedNodeModulesDir);
		return true;
	} catch {
		return false;
	}
}
function storeSourceCheckoutRuntimeDepsCache(params) {
	if (!params.cacheDir) return;
	const nodeModulesDir = path.join(params.installRoot, "node_modules");
	if (!fs.existsSync(nodeModulesDir)) return;
	let tempDir = null;
	try {
		fs.mkdirSync(path.dirname(params.cacheDir), { recursive: true });
		tempDir = fs.mkdtempSync(path.join(path.dirname(params.cacheDir), ".runtime-deps-cache-"));
		fs.cpSync(nodeModulesDir, path.join(tempDir, "node_modules"), { recursive: true });
		fs.rmSync(params.cacheDir, {
			recursive: true,
			force: true
		});
		fs.renameSync(tempDir, params.cacheDir);
	} catch {
		if (tempDir) fs.rmSync(tempDir, {
			recursive: true,
			force: true
		});
	}
}
function createBundledRuntimeDepsInstallEnv(env, options = {}) {
	return {
		...createNpmProjectInstallEnv(env, options),
		npm_config_legacy_peer_deps: "true"
	};
}
function createBundledRuntimeDepsInstallArgs(missingSpecs) {
	missingSpecs.forEach((spec) => {
		parseInstallableRuntimeDepSpec(spec);
	});
	return [
		"install",
		"--ignore-scripts",
		...missingSpecs
	];
}
function resolvePathEnvKey(env, platform) {
	if (platform !== "win32") return "PATH";
	return Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "Path";
}
function isNpmCliPath(candidate) {
	const normalized = candidate.replaceAll("\\", "/").toLowerCase();
	return normalized.endsWith("/npm-cli.js") || normalized.endsWith("/npm/bin/npm-cli.js");
}
function resolveBundledRuntimeDepsNpmRunner(params) {
	const env = params.env ?? process.env;
	const execPath = params.execPath ?? process.execPath;
	const existsSync = params.existsSync ?? fs.existsSync;
	const platform = params.platform ?? process.platform;
	const pathImpl = platform === "win32" ? path.win32 : path.posix;
	const nodeDir = pathImpl.dirname(execPath);
	const rawNpmExecPath = normalizeOptionalLowercaseString(env.npm_execpath) ? env.npm_execpath : void 0;
	const npmCliPath = [
		rawNpmExecPath && isNpmCliPath(rawNpmExecPath) ? rawNpmExecPath : void 0,
		pathImpl.resolve(nodeDir, "../lib/node_modules/npm/bin/npm-cli.js"),
		pathImpl.resolve(nodeDir, "node_modules/npm/bin/npm-cli.js")
	].filter((candidate) => Boolean(candidate)).find((candidate) => pathImpl.isAbsolute(candidate) && existsSync(candidate));
	if (npmCliPath) return {
		command: execPath,
		args: [npmCliPath, ...params.npmArgs]
	};
	if (platform === "win32") {
		const npmExePath = pathImpl.resolve(nodeDir, "npm.exe");
		if (existsSync(npmExePath)) return {
			command: npmExePath,
			args: params.npmArgs
		};
		throw new Error("Unable to resolve a safe npm executable on Windows");
	}
	const pathKey = resolvePathEnvKey(env, platform);
	const currentPath = env[pathKey];
	return {
		command: "npm",
		args: params.npmArgs,
		env: {
			...env,
			[pathKey]: typeof currentPath === "string" && currentPath.length > 0 ? `${nodeDir}${path.delimiter}${currentPath}` : nodeDir
		}
	};
}
function readBundledPluginRuntimeDepsManifest(pluginDir, cache) {
	const cached = cache?.get(pluginDir);
	if (cached) return cached;
	const manifest = readJsonObject(path.join(pluginDir, "openclaw.plugin.json"));
	const channels = manifest?.channels;
	const runtimeDepsManifest = {
		channels: Array.isArray(channels) ? channels.filter((entry) => typeof entry === "string" && entry !== "") : [],
		enabledByDefault: manifest?.enabledByDefault === true
	};
	cache?.set(pluginDir, runtimeDepsManifest);
	return runtimeDepsManifest;
}
function isBundledPluginConfiguredForRuntimeDeps(params) {
	const plugins = normalizePluginsConfig(params.config.plugins);
	if (!passesManifestOwnerBasePolicy({
		plugin: { id: params.pluginId },
		normalizedConfig: plugins,
		allowRestrictiveAllowlistBypass: true
	})) return false;
	const entry = plugins.entries[params.pluginId];
	const manifest = readBundledPluginRuntimeDepsManifest(params.pluginDir, params.manifestCache);
	let hasExplicitChannelDisable = false;
	let hasConfiguredChannel = false;
	for (const channelId of manifest.channels) {
		const normalizedChannelId = normalizeOptionalLowercaseString(channelId);
		if (!normalizedChannelId) continue;
		const channelConfig = params.config.channels?.[normalizedChannelId];
		if (channelConfig && typeof channelConfig === "object" && !Array.isArray(channelConfig) && channelConfig.enabled === false) {
			hasExplicitChannelDisable = true;
			continue;
		}
		if (channelConfig && typeof channelConfig === "object" && !Array.isArray(channelConfig) && channelConfig.enabled === true) return true;
		if (channelConfig && typeof channelConfig === "object" && !Array.isArray(channelConfig) && params.includeConfiguredChannels) hasConfiguredChannel = true;
	}
	if (hasExplicitChannelDisable) return false;
	if (plugins.allow.length > 0 && !plugins.allow.includes(params.pluginId)) return false;
	if (entry?.enabled === true) return true;
	if (hasConfiguredChannel) return true;
	return manifest.enabledByDefault;
}
function shouldIncludeBundledPluginRuntimeDeps(params) {
	if (params.selectedPluginIds) return params.selectedPluginIds.has(params.pluginId);
	const scopedToPluginIds = Boolean(params.pluginIds);
	if (params.pluginIds) {
		if (!params.pluginIds.has(params.pluginId)) return false;
		if (!params.config) return true;
	}
	if (!params.config) return true;
	if (scopedToPluginIds) {
		const plugins = normalizePluginsConfig(params.config.plugins);
		return passesManifestOwnerBasePolicy({
			plugin: { id: params.pluginId },
			normalizedConfig: plugins,
			allowRestrictiveAllowlistBypass: true
		});
	}
	return isBundledPluginConfiguredForRuntimeDeps({
		config: params.config,
		pluginId: params.pluginId,
		pluginDir: params.pluginDir,
		includeConfiguredChannels: params.includeConfiguredChannels,
		manifestCache: params.manifestCache
	});
}
function collectBundledPluginRuntimeDeps(params) {
	const versionMap = /* @__PURE__ */ new Map();
	const manifestCache = /* @__PURE__ */ new Map();
	const includedPluginIds = /* @__PURE__ */ new Set();
	for (const entry of fs.readdirSync(params.extensionsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const pluginId = entry.name;
		const pluginDir = path.join(params.extensionsDir, pluginId);
		if (!shouldIncludeBundledPluginRuntimeDeps({
			config: params.config,
			pluginIds: params.pluginIds,
			selectedPluginIds: params.selectedPluginIds,
			pluginId,
			pluginDir,
			includeConfiguredChannels: params.includeConfiguredChannels,
			manifestCache
		})) continue;
		includedPluginIds.add(pluginId);
		const packageJson = readJsonObject(path.join(pluginDir, "package.json"));
		if (!packageJson) continue;
		for (const [name, rawVersion] of Object.entries(collectRuntimeDeps(packageJson))) {
			const dep = parseInstallableRuntimeDep(name, rawVersion);
			if (!dep) continue;
			const byVersion = versionMap.get(dep.name) ?? /* @__PURE__ */ new Map();
			const pluginIds = byVersion.get(dep.version) ?? /* @__PURE__ */ new Set();
			pluginIds.add(pluginId);
			byVersion.set(dep.version, pluginIds);
			versionMap.set(dep.name, byVersion);
		}
	}
	const deps = [];
	const conflicts = [];
	for (const [name, byVersion] of versionMap.entries()) {
		if (byVersion.size === 1) {
			const [version, pluginIds] = [...byVersion.entries()][0] ?? [];
			if (version) deps.push({
				name,
				version,
				pluginIds: [...pluginIds].toSorted((a, b) => a.localeCompare(b))
			});
			continue;
		}
		const versions = [...byVersion.keys()].toSorted((a, b) => a.localeCompare(b));
		const pluginIdsByVersion = /* @__PURE__ */ new Map();
		for (const [version, pluginIds] of byVersion.entries()) pluginIdsByVersion.set(version, [...pluginIds].toSorted((a, b) => a.localeCompare(b)));
		conflicts.push({
			name,
			versions,
			pluginIdsByVersion
		});
	}
	return {
		deps: deps.toSorted((a, b) => a.name.localeCompare(b.name)),
		conflicts: conflicts.toSorted((a, b) => a.name.localeCompare(b.name)),
		pluginIds: [...includedPluginIds].toSorted((a, b) => a.localeCompare(b))
	};
}
function normalizePluginIdSet(pluginIds) {
	if (!pluginIds) return;
	const normalized = pluginIds.map((entry) => normalizeOptionalLowercaseString(entry)).filter((entry) => Boolean(entry));
	return new Set(normalized);
}
function scanBundledPluginRuntimeDeps(params) {
	if (isSourceCheckoutRoot(params.packageRoot)) return {
		deps: [],
		missing: [],
		conflicts: []
	};
	const extensionsDir = path.join(params.packageRoot, "dist", "extensions");
	if (!fs.existsSync(extensionsDir)) return {
		deps: [],
		missing: [],
		conflicts: []
	};
	const { deps, conflicts, pluginIds } = collectBundledPluginRuntimeDeps({
		extensionsDir,
		config: params.config,
		pluginIds: normalizePluginIdSet(params.pluginIds),
		selectedPluginIds: normalizePluginIdSet(params.selectedPluginIds),
		includeConfiguredChannels: params.includeConfiguredChannels
	});
	const packageRuntimeDeps = pluginIds.length > 0 ? collectMirroredPackageRuntimeDeps(params.packageRoot, new Set(pluginIds)) : [];
	const allDeps = mergeRuntimeDepEntries([...deps, ...packageRuntimeDeps]);
	const packageInstallRootPlan = resolveBundledRuntimeDependencyPackageInstallRootPlan(params.packageRoot, { env: params.env });
	return {
		deps: allDeps,
		missing: allDeps.filter((dep) => {
			if (hasDependencySentinel(packageInstallRootPlan.searchRoots, dep)) return false;
			if (dep.pluginIds.includes(MIRRORED_PACKAGE_RUNTIME_DEP_PLUGIN_ID)) return true;
			return dep.pluginIds.every((pluginId) => {
				return !hasDependencySentinel(resolveBundledRuntimeDependencyInstallRootPlan(path.join(extensionsDir, pluginId), { env: params.env }).searchRoots, dep);
			});
		}),
		conflicts
	};
}
function resolveBundledRuntimeDependencyPackageInstallRootPlan(packageRoot, options = {}) {
	const env = options.env ?? process.env;
	const externalRoots = resolveExternalBundledRuntimeDepsInstallRoots({
		pluginRoot: path.join(packageRoot, "dist", "extensions", "__package__"),
		env
	});
	if (options.forceExternal || env.OPENCLAW_PLUGIN_STAGE_DIR?.trim() || env.STATE_DIRECTORY?.trim() || !isSourceCheckoutRoot(packageRoot)) return createBundledRuntimeDepsInstallRootPlan({
		installRoot: externalRoots.at(-1) ?? resolveExternalBundledRuntimeDepsInstallRoot({
			pluginRoot: path.join(packageRoot, "dist", "extensions", "__package__"),
			env
		}),
		searchRoots: externalRoots,
		external: true
	});
	if (isWritableDirectory(packageRoot)) return createBundledRuntimeDepsInstallRootPlan({
		installRoot: packageRoot,
		searchRoots: [packageRoot],
		external: false
	});
	return createBundledRuntimeDepsInstallRootPlan({
		installRoot: externalRoots.at(-1) ?? resolveExternalBundledRuntimeDepsInstallRoot({
			pluginRoot: path.join(packageRoot, "dist", "extensions", "__package__"),
			env
		}),
		searchRoots: externalRoots,
		external: true
	});
}
function resolveBundledRuntimeDependencyPackageInstallRoot(packageRoot, options = {}) {
	return resolveBundledRuntimeDependencyPackageInstallRootPlan(packageRoot, options).installRoot;
}
function resolveBundledRuntimeDependencyInstallRootPlan(pluginRoot, options = {}) {
	const env = options.env ?? process.env;
	const externalRoots = resolveExternalBundledRuntimeDepsInstallRoots({
		pluginRoot,
		env
	});
	if (options.forceExternal || env.OPENCLAW_PLUGIN_STAGE_DIR?.trim() || env.STATE_DIRECTORY?.trim() || isPackagedBundledPluginRoot(pluginRoot)) return createBundledRuntimeDepsInstallRootPlan({
		installRoot: externalRoots.at(-1) ?? resolveExternalBundledRuntimeDepsInstallRoot({
			pluginRoot,
			env
		}),
		searchRoots: externalRoots,
		external: true
	});
	if (isWritableDirectory(pluginRoot)) return createBundledRuntimeDepsInstallRootPlan({
		installRoot: pluginRoot,
		searchRoots: [pluginRoot],
		external: false
	});
	return createBundledRuntimeDepsInstallRootPlan({
		installRoot: externalRoots.at(-1) ?? resolveExternalBundledRuntimeDepsInstallRoot({
			pluginRoot,
			env
		}),
		searchRoots: externalRoots,
		external: true
	});
}
function shouldCleanBundledRuntimeDepsInstallExecutionRoot(params) {
	const installRoot = path.resolve(params.installRoot);
	return path.resolve(params.installExecutionRoot).startsWith(`${installRoot}${path.sep}`);
}
function createNpmInstallExecutionManifest(installSpecs) {
	const dependencies = {};
	for (const spec of installSpecs) {
		const dep = parseInstallableRuntimeDepSpec(spec);
		dependencies[dep.name] = dep.version;
	}
	const sortedDependencies = Object.fromEntries(Object.entries(dependencies).toSorted(([left], [right]) => left.localeCompare(right)));
	return {
		name: "openclaw-runtime-deps-install",
		private: true,
		...Object.keys(sortedDependencies).length > 0 ? { dependencies: sortedDependencies } : {}
	};
}
function ensureNpmInstallExecutionManifest(installExecutionRoot, installSpecs = []) {
	const manifestPath = path.join(installExecutionRoot, "package.json");
	const manifest = createNpmInstallExecutionManifest(installSpecs);
	const nextContents = `${JSON.stringify(manifest, null, 2)}\n`;
	if (fs.existsSync(manifestPath) && fs.readFileSync(manifestPath, "utf8") === nextContents) return;
	fs.writeFileSync(manifestPath, nextContents, "utf8");
}
function formatBundledRuntimeDepsInstallError(result) {
	return [
		result.error?.message,
		result.signal ? `terminated by ${result.signal}` : null,
		result.stderr,
		result.stdout
	].filter(Boolean).join("\n").trim() || "npm install failed";
}
function formatBundledRuntimeDepsInstallElapsed(ms) {
	const seconds = Math.max(0, Math.round(ms / 1e3));
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}
function emitBundledRuntimeDepsOutputProgress(chunk, stream, onProgress) {
	if (!onProgress) return;
	const lines = chunk.toString("utf8").split(/\r\n|\n|\r/u).map((line) => sanitizeTerminalText(line).trim()).filter((line) => line.length > 0).slice(-3);
	for (const line of lines) onProgress(`npm ${stream}: ${line}`);
}
async function spawnBundledRuntimeDepsInstall(params) {
	await new Promise((resolve, reject) => {
		const startedAtMs = Date.now();
		const heartbeat = params.onProgress && setInterval(() => {
			params.onProgress?.(`npm install still running (${formatBundledRuntimeDepsInstallElapsed(Date.now() - startedAtMs)} elapsed)`);
		}, BUNDLED_RUNTIME_DEPS_INSTALL_PROGRESS_INTERVAL_MS);
		heartbeat?.unref?.();
		const settle = (fn) => {
			if (heartbeat) clearInterval(heartbeat);
			fn();
		};
		const child = spawn(params.command, params.args, {
			cwd: params.cwd,
			env: params.env,
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			],
			windowsHide: true
		});
		const stdout = [];
		const stderr = [];
		child.stdout?.on("data", (chunk) => {
			stdout.push(chunk);
			emitBundledRuntimeDepsOutputProgress(chunk, "stdout", params.onProgress);
		});
		child.stderr?.on("data", (chunk) => {
			stderr.push(chunk);
			emitBundledRuntimeDepsOutputProgress(chunk, "stderr", params.onProgress);
		});
		child.on("error", (error) => {
			settle(() => reject(new Error(formatBundledRuntimeDepsInstallError({ error }))));
		});
		child.on("close", (status, signal) => {
			if (status === 0 && !signal) {
				settle(resolve);
				return;
			}
			settle(() => reject(new Error(formatBundledRuntimeDepsInstallError({
				status,
				signal,
				stdout: Buffer.concat(stdout).toString("utf8"),
				stderr: Buffer.concat(stderr).toString("utf8")
			}))));
		});
	});
}
function installBundledRuntimeDeps(params) {
	const installExecutionRoot = params.installExecutionRoot ?? params.installRoot;
	const isolatedExecutionRoot = path.resolve(installExecutionRoot) !== path.resolve(params.installRoot);
	const cleanInstallExecutionRoot = isolatedExecutionRoot && shouldCleanBundledRuntimeDepsInstallExecutionRoot({
		installRoot: params.installRoot,
		installExecutionRoot
	});
	try {
		fs.mkdirSync(params.installRoot, { recursive: true });
		fs.mkdirSync(installExecutionRoot, { recursive: true });
		const diskWarning = createLowDiskSpaceWarning({
			targetPath: installExecutionRoot,
			purpose: "bundled plugin runtime dependency staging"
		});
		if (diskWarning) params.warn?.(diskWarning);
		ensureNpmInstallExecutionManifest(installExecutionRoot, params.installSpecs ?? params.missingSpecs);
		const installEnv = createBundledRuntimeDepsInstallEnv(params.env, { cacheDir: path.join(installExecutionRoot, ".openclaw-npm-cache") });
		const npmRunner = resolveBundledRuntimeDepsNpmRunner({
			env: installEnv,
			npmArgs: createBundledRuntimeDepsInstallArgs(params.missingSpecs)
		});
		const result = spawnSync(npmRunner.command, npmRunner.args, {
			cwd: installExecutionRoot,
			encoding: "utf8",
			env: npmRunner.env ?? installEnv,
			stdio: "pipe",
			windowsHide: true
		});
		if (result.status !== 0 || result.error) throw new Error(formatBundledRuntimeDepsInstallError(result));
		assertBundledRuntimeDepsInstalled(installExecutionRoot, params.missingSpecs);
		if (isolatedExecutionRoot) {
			const stagedNodeModulesDir = path.join(installExecutionRoot, "node_modules");
			if (!fs.existsSync(stagedNodeModulesDir)) throw new Error("npm install did not produce node_modules");
			const targetNodeModulesDir = path.join(params.installRoot, "node_modules");
			if (params.linkNodeModulesFromExecutionRoot) replaceNodeModulesDirFromCache(targetNodeModulesDir, stagedNodeModulesDir);
			else replaceNodeModulesDir(targetNodeModulesDir, stagedNodeModulesDir);
			assertBundledRuntimeDepsInstalled(params.installRoot, params.missingSpecs);
		}
	} finally {
		if (cleanInstallExecutionRoot) fs.rmSync(installExecutionRoot, {
			recursive: true,
			force: true
		});
	}
}
async function installBundledRuntimeDepsAsync(params) {
	const installExecutionRoot = params.installExecutionRoot ?? params.installRoot;
	const isolatedExecutionRoot = path.resolve(installExecutionRoot) !== path.resolve(params.installRoot);
	const cleanInstallExecutionRoot = isolatedExecutionRoot && shouldCleanBundledRuntimeDepsInstallExecutionRoot({
		installRoot: params.installRoot,
		installExecutionRoot
	});
	try {
		fs.mkdirSync(params.installRoot, { recursive: true });
		fs.mkdirSync(installExecutionRoot, { recursive: true });
		const diskWarning = createLowDiskSpaceWarning({
			targetPath: installExecutionRoot,
			purpose: "bundled plugin runtime dependency staging"
		});
		if (diskWarning) params.warn?.(diskWarning);
		ensureNpmInstallExecutionManifest(installExecutionRoot, params.installSpecs ?? params.missingSpecs);
		const installEnv = createBundledRuntimeDepsInstallEnv(params.env, { cacheDir: path.join(installExecutionRoot, ".openclaw-npm-cache") });
		const npmRunner = resolveBundledRuntimeDepsNpmRunner({
			env: installEnv,
			npmArgs: createBundledRuntimeDepsInstallArgs(params.missingSpecs)
		});
		params.onProgress?.(`Starting npm install for bundled plugin runtime deps: ${params.missingSpecs.join(", ")}`);
		await spawnBundledRuntimeDepsInstall({
			command: npmRunner.command,
			args: npmRunner.args,
			cwd: installExecutionRoot,
			env: npmRunner.env ?? installEnv,
			onProgress: params.onProgress
		});
		assertBundledRuntimeDepsInstalled(installExecutionRoot, params.missingSpecs);
		if (isolatedExecutionRoot) {
			const stagedNodeModulesDir = path.join(installExecutionRoot, "node_modules");
			if (!fs.existsSync(stagedNodeModulesDir)) throw new Error("npm install did not produce node_modules");
			const targetNodeModulesDir = path.join(params.installRoot, "node_modules");
			if (params.linkNodeModulesFromExecutionRoot) replaceNodeModulesDirFromCache(targetNodeModulesDir, stagedNodeModulesDir);
			else replaceNodeModulesDir(targetNodeModulesDir, stagedNodeModulesDir);
			assertBundledRuntimeDepsInstalled(params.installRoot, params.missingSpecs);
		}
	} finally {
		if (cleanInstallExecutionRoot) fs.rmSync(installExecutionRoot, {
			recursive: true,
			force: true
		});
	}
}
async function withBundledRuntimeDepsInstallRootLockAsync(installRoot, run) {
	fs.mkdirSync(installRoot, { recursive: true });
	const lockDir = path.join(installRoot, BUNDLED_RUNTIME_DEPS_LOCK_DIR);
	const startedAt = Date.now();
	let locked = false;
	while (!locked) try {
		fs.mkdirSync(lockDir);
		try {
			fs.writeFileSync(path.join(lockDir, BUNDLED_RUNTIME_DEPS_LOCK_OWNER_FILE), `${JSON.stringify({
				pid: process.pid,
				createdAtMs: Date.now()
			}, null, 2)}\n`, "utf8");
		} catch (ownerWriteError) {
			fs.rmSync(lockDir, {
				recursive: true,
				force: true
			});
			throw ownerWriteError;
		}
		locked = true;
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		removeRuntimeDepsLockIfStale(lockDir, Date.now());
		const nowMs = Date.now();
		if (nowMs - startedAt > BUNDLED_RUNTIME_DEPS_LOCK_TIMEOUT_MS) throw new Error(formatRuntimeDepsLockTimeoutMessage({
			lockDir,
			owner: readRuntimeDepsLockOwner(lockDir),
			waitedMs: nowMs - startedAt,
			nowMs
		}), { cause: error });
		await sleep(BUNDLED_RUNTIME_DEPS_LOCK_WAIT_MS);
	}
	try {
		return await run();
	} finally {
		fs.rmSync(lockDir, {
			recursive: true,
			force: true
		});
	}
}
async function repairBundledRuntimeDepsInstallRootAsync(params) {
	return await withBundledRuntimeDepsInstallRootLockAsync(params.installRoot, async () => {
		const previousRetainedManifestSpecs = readRetainedRuntimeDepsManifest(params.installRoot);
		const installSpecs = [...new Set(params.installSpecs)].toSorted((left, right) => left.localeCompare(right));
		const install = params.installDeps ?? ((installParams) => installBundledRuntimeDepsAsync({
			installRoot: installParams.installRoot,
			missingSpecs: installParams.missingSpecs,
			installSpecs: installParams.installSpecs,
			env: params.env,
			warn: params.warn,
			onProgress: params.onProgress
		}));
		const finishActivity = beginBundledRuntimeDepsInstall({
			installRoot: params.installRoot,
			missingSpecs: params.missingSpecs,
			installSpecs
		});
		try {
			await install({
				installRoot: params.installRoot,
				missingSpecs: params.missingSpecs,
				installSpecs
			});
		} finally {
			finishActivity();
		}
		pruneRetainedRuntimeDepsManifestSpecs({
			installRoot: params.installRoot,
			previousSpecs: previousRetainedManifestSpecs,
			nextSpecs: installSpecs
		});
		writeRetainedRuntimeDepsManifest(params.installRoot, installSpecs);
		return { installSpecs };
	});
}
function ensureBundledPluginRuntimeDeps(params) {
	if (params.config && !isBundledPluginConfiguredForRuntimeDeps({
		config: params.config,
		pluginId: params.pluginId,
		pluginDir: params.pluginRoot
	})) return {
		installedSpecs: [],
		retainSpecs: []
	};
	const packageJson = readJsonObject(path.join(params.pluginRoot, "package.json"));
	if (!packageJson) return {
		installedSpecs: [],
		retainSpecs: []
	};
	const pluginDeps = Object.entries(collectRuntimeDeps(packageJson)).map(([name, rawVersion]) => parseInstallableRuntimeDep(name, rawVersion)).filter((entry) => Boolean(entry));
	const installRootPlan = resolveBundledRuntimeDependencyInstallRootPlan(params.pluginRoot, { env: params.env });
	const installRoot = installRootPlan.installRoot;
	const packageRoot = resolveBundledRuntimeDependencyPackageRoot(params.pluginRoot);
	const packageRuntimeDeps = packageRoot && path.resolve(installRoot) !== path.resolve(params.pluginRoot) ? collectMirroredPackageRuntimeDeps(packageRoot, new Set([params.pluginId])) : [];
	const deps = mergeInstallableRuntimeDeps([...pluginDeps, ...packageRuntimeDeps]);
	if (deps.length === 0) return {
		installedSpecs: [],
		retainSpecs: []
	};
	return withBundledRuntimeDepsInstallRootLock(installRoot, () => {
		const persistRetainedManifest = shouldPersistRetainedRuntimeDepsManifest({
			pluginRoot: params.pluginRoot,
			installRoot
		});
		if (!persistRetainedManifest) removeRetainedRuntimeDepsManifest(installRoot);
		linkBundledRuntimeDepsFromSearchRoots({
			deps,
			searchRoots: installRootPlan.searchRoots,
			installRoot
		});
		const dependencySpecs = createBundledRuntimeDepsWritableInstallSpecs({
			deps,
			searchRoots: installRootPlan.searchRoots,
			installRoot
		});
		const retainedManifestSpecs = persistRetainedManifest ? readRetainedRuntimeDepsManifest(installRoot) : [];
		const readonlySearchRoots = installRootPlan.searchRoots.filter((rootDir) => path.resolve(rootDir) !== path.resolve(installRoot));
		const alreadyStagedSpecs = persistRetainedManifest ? collectAlreadyStagedBundledRuntimeDepSpecs({
			pluginRoot: params.pluginRoot,
			installRoot,
			config: params.config
		}).filter((spec) => !hasDependencySentinel(readonlySearchRoots, parseInstallableRuntimeDepSpec(spec))) : [];
		const retainedAllowedSpecs = new Set([...alreadyStagedSpecs, ...dependencySpecs]);
		const retainSpecIfActive = (spec) => params.config === void 0 || retainedAllowedSpecs.has(spec);
		const installSpecs = [...new Set([
			...(params.retainSpecs ?? []).filter(retainSpecIfActive),
			...retainedManifestSpecs.filter(retainSpecIfActive),
			...alreadyStagedSpecs,
			...dependencySpecs
		])].toSorted((left, right) => left.localeCompare(right));
		const missingSpecs = deps.filter((dep) => !hasDependencySentinel(installRootPlan.searchRoots, dep)).map((dep) => `${dep.name}@${dep.version}`).toSorted((left, right) => left.localeCompare(right));
		if (missingSpecs.length === 0) {
			if (params.config !== void 0 && persistRetainedManifest && installSpecs.length > 0) writeRetainedRuntimeDepsManifest(installRoot, installSpecs);
			return {
				installedSpecs: [],
				retainSpecs: []
			};
		}
		const cacheDir = resolveSourceCheckoutRuntimeDepsCacheDir({
			pluginId: params.pluginId,
			pluginRoot: params.pluginRoot,
			installSpecs
		});
		const isPluginRootInstall = path.resolve(installRoot) === path.resolve(params.pluginRoot);
		const sourceCheckoutCacheStage = cacheDir && isPluginRootInstall && resolveSourceCheckoutPackageRoot(params.pluginRoot) ? cacheDir : void 0;
		const installExecutionRoot = sourceCheckoutCacheStage ?? (isPluginRootInstall ? path.join(installRoot, PLUGIN_ROOT_INSTALL_STAGE_DIR) : void 0);
		if (restoreSourceCheckoutRuntimeDepsFromCache({
			cacheDir,
			deps,
			installRoot
		})) return {
			installedSpecs: [],
			retainSpecs: []
		};
		const install = params.installDeps ?? ((installParams) => {
			const isolatedExecutionRoot = installParams.installExecutionRoot && path.resolve(installParams.installExecutionRoot) !== path.resolve(installParams.installRoot);
			return installBundledRuntimeDeps({
				installRoot: installParams.installRoot,
				installExecutionRoot: installParams.installExecutionRoot,
				linkNodeModulesFromExecutionRoot: installParams.linkNodeModulesFromExecutionRoot,
				missingSpecs: isolatedExecutionRoot ? installParams.installSpecs ?? installParams.missingSpecs : installParams.missingSpecs,
				installSpecs: installParams.installSpecs,
				env: params.env
			});
		});
		const finishActivity = beginBundledRuntimeDepsInstall({
			installRoot,
			missingSpecs,
			installSpecs,
			pluginId: params.pluginId
		});
		try {
			install({
				installRoot,
				installExecutionRoot,
				...sourceCheckoutCacheStage ? { linkNodeModulesFromExecutionRoot: true } : {},
				missingSpecs,
				installSpecs
			});
		} finally {
			finishActivity();
		}
		linkBundledRuntimeDepsFromSearchRoots({
			deps,
			searchRoots: installRootPlan.searchRoots,
			installRoot
		});
		const cacheAlreadyPopulated = Boolean(sourceCheckoutCacheStage && hasAllDependencySentinels(sourceCheckoutCacheStage, deps));
		if (persistRetainedManifest) writeRetainedRuntimeDepsManifest(installRoot, installSpecs);
		if (!cacheAlreadyPopulated) storeSourceCheckoutRuntimeDepsCache({
			cacheDir,
			installRoot
		});
		return {
			installedSpecs: missingSpecs,
			retainSpecs: installSpecs
		};
	});
}
//#endregion
//#region src/plugins/bundled-runtime-mirror.ts
const BUNDLED_RUNTIME_MIRROR_METADATA_FILE = ".openclaw-runtime-mirror.json";
const BUNDLED_RUNTIME_MIRROR_METADATA_VERSION = 1;
function refreshBundledPluginRuntimeMirrorRoot(params) {
	if (path.resolve(params.sourceRoot) === path.resolve(params.targetRoot)) return false;
	const metadata = createBundledRuntimeMirrorMetadata(params, params.precomputedSourceMetadata);
	if (isBundledRuntimeMirrorRootFresh(params.targetRoot, metadata)) return false;
	copyBundledPluginRuntimeRoot(params.sourceRoot, params.targetRoot);
	writeBundledRuntimeMirrorMetadata(params.targetRoot, metadata);
	return true;
}
function copyBundledPluginRuntimeRoot(sourceRoot, targetRoot) {
	if (path.resolve(sourceRoot) === path.resolve(targetRoot)) return;
	fs.mkdirSync(targetRoot, {
		recursive: true,
		mode: 493
	});
	const mirroredNames = /* @__PURE__ */ new Set();
	for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
		if (shouldIgnoreBundledRuntimeMirrorEntry(entry.name)) continue;
		if (!entry.isDirectory() && !entry.isSymbolicLink() && !entry.isFile()) continue;
		mirroredNames.add(entry.name);
		const sourcePath = path.join(sourceRoot, entry.name);
		const targetPath = path.join(targetRoot, entry.name);
		if (entry.isDirectory()) {
			removeBundledRuntimeMirrorPathIfTypeChanged(targetPath, "directory");
			copyBundledPluginRuntimeRoot(sourcePath, targetPath);
			continue;
		}
		if (entry.isSymbolicLink()) {
			removeBundledRuntimeMirrorPathIfTypeChanged(targetPath, "symlink");
			replaceBundledRuntimeMirrorSymlinkAtomic(fs.readlinkSync(sourcePath), targetPath);
			continue;
		}
		removeBundledRuntimeMirrorPathIfTypeChanged(targetPath, "file");
		copyBundledRuntimeMirrorFileAtomic(sourcePath, targetPath);
		try {
			const sourceMode = fs.statSync(sourcePath).mode;
			fs.chmodSync(targetPath, sourceMode | 384);
		} catch {}
	}
	pruneStaleBundledRuntimeMirrorEntries(targetRoot, mirroredNames);
}
function pruneStaleBundledRuntimeMirrorEntries(targetRoot, mirroredNames) {
	for (const entry of fs.readdirSync(targetRoot, { withFileTypes: true })) {
		if (shouldIgnoreBundledRuntimeMirrorEntry(entry.name)) continue;
		if (mirroredNames.has(entry.name)) continue;
		fs.rmSync(path.join(targetRoot, entry.name), {
			recursive: true,
			force: true
		});
	}
}
function removeBundledRuntimeMirrorPathIfTypeChanged(targetPath, expectedType) {
	let stat;
	try {
		stat = fs.lstatSync(targetPath);
	} catch {
		return;
	}
	if (!(expectedType === "directory" ? stat.isDirectory() : expectedType === "symlink" ? stat.isSymbolicLink() : stat.isFile())) fs.rmSync(targetPath, {
		recursive: true,
		force: true
	});
}
function replaceBundledRuntimeMirrorSymlinkAtomic(linkTarget, targetPath) {
	fs.mkdirSync(path.dirname(targetPath), {
		recursive: true,
		mode: 493
	});
	const tempPath = createBundledRuntimeMirrorTempPath(targetPath);
	try {
		fs.symlinkSync(linkTarget, tempPath);
		fs.renameSync(tempPath, targetPath);
	} finally {
		fs.rmSync(tempPath, { force: true });
	}
}
function copyBundledRuntimeMirrorFileAtomic(sourcePath, targetPath) {
	fs.mkdirSync(path.dirname(targetPath), {
		recursive: true,
		mode: 493
	});
	const tempPath = createBundledRuntimeMirrorTempPath(targetPath);
	try {
		fs.copyFileSync(sourcePath, tempPath);
		fs.renameSync(tempPath, targetPath);
	} finally {
		fs.rmSync(tempPath, { force: true });
	}
}
function createBundledRuntimeMirrorTempPath(targetPath) {
	return path.join(path.dirname(targetPath), `.openclaw-mirror-${process.pid}-${process.hrtime.bigint()}-${path.basename(targetPath)}.tmp`);
}
function precomputeBundledRuntimeMirrorMetadata(params) {
	return {
		sourceRoot: resolveBundledRuntimeMirrorSourceRootId(params.sourceRoot),
		sourceFingerprint: fingerprintBundledRuntimeMirrorSourceRoot(params.sourceRoot)
	};
}
function createBundledRuntimeMirrorMetadata(params, precomputedSourceMetadata) {
	const sourceRoot = resolveBundledRuntimeMirrorSourceRootId(params.sourceRoot);
	return {
		version: BUNDLED_RUNTIME_MIRROR_METADATA_VERSION,
		pluginId: params.pluginId,
		sourceRoot,
		sourceFingerprint: precomputedSourceMetadata?.sourceRoot === sourceRoot ? precomputedSourceMetadata.sourceFingerprint : fingerprintBundledRuntimeMirrorSourceRoot(params.sourceRoot)
	};
}
function isBundledRuntimeMirrorRootFresh(targetRoot, expected) {
	try {
		if (!fs.lstatSync(targetRoot).isDirectory()) return false;
	} catch {
		return false;
	}
	const actual = readBundledRuntimeMirrorMetadata(targetRoot);
	return actual?.version === expected.version && actual.pluginId === expected.pluginId && actual.sourceRoot === expected.sourceRoot && actual.sourceFingerprint === expected.sourceFingerprint;
}
function readBundledRuntimeMirrorMetadata(targetRoot) {
	try {
		const parsed = JSON.parse(fs.readFileSync(path.join(targetRoot, BUNDLED_RUNTIME_MIRROR_METADATA_FILE), "utf8"));
		if (parsed.version !== BUNDLED_RUNTIME_MIRROR_METADATA_VERSION || typeof parsed.pluginId !== "string" || typeof parsed.sourceRoot !== "string" || typeof parsed.sourceFingerprint !== "string") return null;
		return parsed;
	} catch {
		return null;
	}
}
function writeBundledRuntimeMirrorMetadata(targetRoot, metadata) {
	fs.writeFileSync(path.join(targetRoot, BUNDLED_RUNTIME_MIRROR_METADATA_FILE), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}
function fingerprintBundledRuntimeMirrorSourceRoot(sourceRoot) {
	const hash = createHash("sha256");
	hashBundledRuntimeMirrorDirectory(hash, sourceRoot, sourceRoot);
	return hash.digest("hex");
}
function hashBundledRuntimeMirrorDirectory(hash, sourceRoot, directory) {
	const entries = fs.readdirSync(directory, { withFileTypes: true }).filter((entry) => !shouldIgnoreBundledRuntimeMirrorEntry(entry.name)).toSorted((left, right) => left.name.localeCompare(right.name));
	for (const entry of entries) {
		const sourcePath = path.join(directory, entry.name);
		const relativePath = path.relative(sourceRoot, sourcePath).replaceAll(path.sep, "/");
		const stat = fs.lstatSync(sourcePath, { bigint: true });
		if (entry.isDirectory()) {
			updateBundledRuntimeMirrorHash(hash, [
				"dir",
				relativePath,
				formatBundledRuntimeMirrorMode(stat.mode)
			]);
			hashBundledRuntimeMirrorDirectory(hash, sourceRoot, sourcePath);
			continue;
		}
		if (entry.isSymbolicLink()) {
			updateBundledRuntimeMirrorHash(hash, [
				"symlink",
				relativePath,
				formatBundledRuntimeMirrorMode(stat.mode),
				stat.ctimeNs.toString(),
				fs.readlinkSync(sourcePath)
			]);
			continue;
		}
		if (!entry.isFile()) continue;
		updateBundledRuntimeMirrorHash(hash, [
			"file",
			relativePath,
			formatBundledRuntimeMirrorMode(stat.mode),
			stat.size.toString(),
			stat.mtimeNs.toString(),
			stat.ctimeNs.toString()
		]);
	}
}
function updateBundledRuntimeMirrorHash(hash, fields) {
	hash.update(JSON.stringify(fields));
	hash.update("\n");
}
function formatBundledRuntimeMirrorMode(mode) {
	return (mode & 4095n).toString(8);
}
function resolveBundledRuntimeMirrorSourceRootId(sourceRoot) {
	try {
		return fs.realpathSync.native(sourceRoot);
	} catch {
		return path.resolve(sourceRoot);
	}
}
function shouldIgnoreBundledRuntimeMirrorEntry(name) {
	return name === "node_modules" || name === BUNDLED_RUNTIME_MIRROR_METADATA_FILE;
}
//#endregion
//#region src/plugins/bundled-runtime-root.ts
const bundledRuntimeDepsRetainSpecsByInstallRoot = /* @__PURE__ */ new Map();
const BUNDLED_RUNTIME_MIRROR_LOCK_DIR = ".openclaw-runtime-mirror.lock";
function isBuiltBundledPluginRuntimeRoot(pluginRoot) {
	const extensionsDir = path.dirname(pluginRoot);
	const buildDir = path.dirname(extensionsDir);
	return path.basename(extensionsDir) === "extensions" && (path.basename(buildDir) === "dist" || path.basename(buildDir) === "dist-runtime");
}
function prepareBundledPluginRuntimeRoot(params) {
	const env = params.env ?? process.env;
	const installRootPlan = resolveBundledRuntimeDependencyInstallRootPlan(params.pluginRoot, { env });
	const installRoot = installRootPlan.installRoot;
	const retainSpecs = bundledRuntimeDepsRetainSpecsByInstallRoot.get(installRoot) ?? [];
	const depsInstallResult = ensureBundledPluginRuntimeDeps({
		pluginId: params.pluginId,
		pluginRoot: params.pluginRoot,
		env,
		retainSpecs
	});
	if (depsInstallResult.installedSpecs.length > 0) {
		bundledRuntimeDepsRetainSpecsByInstallRoot.set(installRoot, [...new Set([...retainSpecs, ...depsInstallResult.retainSpecs])].toSorted((left, right) => left.localeCompare(right)));
		params.logInstalled?.(depsInstallResult.installedSpecs);
	}
	if (path.resolve(installRoot) === path.resolve(params.pluginRoot)) return {
		pluginRoot: params.pluginRoot,
		modulePath: params.modulePath
	};
	const packageRoot = resolveBundledRuntimeDependencyPackageRoot(params.pluginRoot);
	if (packageRoot) registerBundledRuntimeDependencyNodePath(packageRoot);
	for (const searchRoot of installRootPlan.searchRoots) registerBundledRuntimeDependencyNodePath(searchRoot);
	const mirrorRoot = mirrorBundledPluginRuntimeRoot({
		pluginId: params.pluginId,
		pluginRoot: params.pluginRoot,
		installRoot
	});
	return {
		pluginRoot: mirrorRoot,
		modulePath: remapBundledPluginRuntimePath({
			source: params.modulePath,
			pluginRoot: params.pluginRoot,
			mirroredRoot: mirrorRoot
		})
	};
}
function remapBundledPluginRuntimePath(params) {
	const relativePath = path.relative(params.pluginRoot, params.source);
	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return params.source;
	return path.join(params.mirroredRoot, relativePath);
}
function mirrorBundledPluginRuntimeRoot(params) {
	const sourceDistRoot = path.dirname(path.dirname(params.pluginRoot));
	const mirrorParent = path.join(params.installRoot, path.basename(sourceDistRoot), "extensions");
	const mirrorRoot = path.join(mirrorParent, params.pluginId);
	const precomputedPluginRootMetadata = path.resolve(mirrorRoot) === path.resolve(params.pluginRoot) ? void 0 : precomputeBundledRuntimeMirrorMetadata({ sourceRoot: params.pluginRoot });
	const precomputedCanonicalPluginRootMetadata = precomputeCanonicalBundledRuntimeDistPluginMetadata({
		pluginRoot: params.pluginRoot,
		sourceDistRoot
	});
	return withBundledRuntimeDepsFilesystemLock(params.installRoot, BUNDLED_RUNTIME_MIRROR_LOCK_DIR, () => {
		const preparedMirrorParent = prepareBundledPluginRuntimeDistMirror({
			installRoot: params.installRoot,
			pluginRoot: params.pluginRoot,
			precomputedCanonicalPluginRootMetadata
		});
		const preparedMirrorRoot = path.join(preparedMirrorParent, params.pluginId);
		fs.mkdirSync(params.installRoot, { recursive: true });
		try {
			fs.chmodSync(params.installRoot, 493);
		} catch {}
		fs.mkdirSync(preparedMirrorParent, { recursive: true });
		try {
			fs.chmodSync(preparedMirrorParent, 493);
		} catch {}
		fs.accessSync(preparedMirrorParent, fs.constants.W_OK);
		if (path.resolve(preparedMirrorRoot) === path.resolve(params.pluginRoot)) return preparedMirrorRoot;
		refreshBundledPluginRuntimeMirrorRoot({
			pluginId: params.pluginId,
			sourceRoot: params.pluginRoot,
			targetRoot: preparedMirrorRoot,
			tempDirParent: preparedMirrorParent,
			precomputedSourceMetadata: precomputedPluginRootMetadata
		});
		return preparedMirrorRoot;
	});
}
function prepareBundledPluginRuntimeDistMirror(params) {
	const sourceExtensionsRoot = path.dirname(params.pluginRoot);
	const sourceDistRoot = path.dirname(sourceExtensionsRoot);
	const sourceDistRootName = path.basename(sourceDistRoot);
	const mirrorDistRoot = path.join(params.installRoot, sourceDistRootName);
	const mirrorExtensionsRoot = path.join(mirrorDistRoot, "extensions");
	ensureBundledRuntimeMirrorDirectory(mirrorDistRoot);
	fs.mkdirSync(mirrorExtensionsRoot, {
		recursive: true,
		mode: 493
	});
	ensureBundledRuntimeDistPackageJson(mirrorDistRoot);
	mirrorBundledRuntimeDistRootEntries({
		sourceDistRoot,
		mirrorDistRoot
	});
	if (sourceDistRootName === "dist-runtime") mirrorCanonicalBundledRuntimeDistRoot({
		installRoot: params.installRoot,
		pluginRoot: params.pluginRoot,
		sourceRuntimeDistRoot: sourceDistRoot,
		precomputedSourceMetadata: params.precomputedCanonicalPluginRootMetadata
	});
	ensureOpenClawPluginSdkAlias(mirrorDistRoot);
	return mirrorExtensionsRoot;
}
function ensureBundledRuntimeMirrorDirectory(targetRoot) {
	try {
		const stat = fs.lstatSync(targetRoot);
		if (stat.isDirectory() && !stat.isSymbolicLink()) return;
		fs.rmSync(targetRoot, {
			recursive: true,
			force: true
		});
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	fs.mkdirSync(targetRoot, {
		recursive: true,
		mode: 493
	});
}
function mirrorBundledRuntimeDistRootEntries(params) {
	for (const entry of fs.readdirSync(params.sourceDistRoot, { withFileTypes: true })) {
		if (entry.name === "extensions") continue;
		const sourcePath = path.join(params.sourceDistRoot, entry.name);
		const targetPath = path.join(params.mirrorDistRoot, entry.name);
		if (path.resolve(sourcePath) === path.resolve(targetPath)) continue;
		if (entry.isFile() && shouldMaterializeBundledRuntimeMirrorDistFile(sourcePath)) {
			materializeBundledRuntimeMirrorDistFile(sourcePath, targetPath);
			continue;
		}
		if (fs.existsSync(targetPath)) continue;
		try {
			fs.symlinkSync(sourcePath, targetPath, entry.isDirectory() ? "junction" : "file");
		} catch {
			if (fs.existsSync(targetPath)) continue;
			if (entry.isDirectory()) copyBundledPluginRuntimeRoot(sourcePath, targetPath);
			else if (entry.isFile()) fs.copyFileSync(sourcePath, targetPath);
		}
	}
}
function mirrorCanonicalBundledRuntimeDistRoot(params) {
	const sourceCanonicalDistRoot = path.join(path.dirname(params.sourceRuntimeDistRoot), "dist");
	if (!fs.existsSync(sourceCanonicalDistRoot)) return;
	const targetCanonicalDistRoot = path.join(params.installRoot, "dist");
	ensureBundledRuntimeMirrorDirectory(targetCanonicalDistRoot);
	fs.mkdirSync(path.join(targetCanonicalDistRoot, "extensions"), {
		recursive: true,
		mode: 493
	});
	ensureBundledRuntimeDistPackageJson(targetCanonicalDistRoot);
	mirrorBundledRuntimeDistRootEntries({
		sourceDistRoot: sourceCanonicalDistRoot,
		mirrorDistRoot: targetCanonicalDistRoot
	});
	ensureOpenClawPluginSdkAlias(targetCanonicalDistRoot);
	const pluginId = path.basename(params.pluginRoot);
	const sourceCanonicalPluginRoot = path.join(sourceCanonicalDistRoot, "extensions", pluginId);
	if (!fs.existsSync(sourceCanonicalPluginRoot)) return;
	const targetCanonicalPluginRoot = path.join(targetCanonicalDistRoot, "extensions", pluginId);
	refreshBundledPluginRuntimeMirrorRoot({
		pluginId,
		sourceRoot: sourceCanonicalPluginRoot,
		targetRoot: targetCanonicalPluginRoot,
		tempDirParent: path.dirname(targetCanonicalPluginRoot),
		precomputedSourceMetadata: params.precomputedSourceMetadata
	});
}
function precomputeCanonicalBundledRuntimeDistPluginMetadata(params) {
	if (path.basename(params.sourceDistRoot) !== "dist-runtime") return;
	const pluginId = path.basename(params.pluginRoot);
	const sourceCanonicalPluginRoot = path.join(path.dirname(params.sourceDistRoot), "dist", "extensions", pluginId);
	if (!fs.existsSync(sourceCanonicalPluginRoot)) return;
	return precomputeBundledRuntimeMirrorMetadata({ sourceRoot: sourceCanonicalPluginRoot });
}
function ensureBundledRuntimeDistPackageJson(mirrorDistRoot) {
	const packageJsonPath = path.join(mirrorDistRoot, "package.json");
	if (fs.existsSync(packageJsonPath)) return;
	writeRuntimeJsonFile(packageJsonPath, { type: "module" });
}
function writeRuntimeJsonFile(targetPath, value) {
	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
function hasRuntimeDefaultExport(sourcePath) {
	const text = fs.readFileSync(sourcePath, "utf8");
	return /\bexport\s+default\b/u.test(text) || /\bas\s+default\b/u.test(text);
}
function writeRuntimeModuleWrapper(sourcePath, targetPath) {
	const specifier = path.relative(path.dirname(targetPath), sourcePath).replaceAll(path.sep, "/");
	const normalizedSpecifier = specifier.startsWith(".") ? specifier : `./${specifier}`;
	const defaultForwarder = hasRuntimeDefaultExport(sourcePath) ? [
		`import defaultModule from ${JSON.stringify(normalizedSpecifier)};`,
		`let defaultExport = defaultModule;`,
		`for (let index = 0; index < 4 && defaultExport && typeof defaultExport === "object" && "default" in defaultExport; index += 1) {`,
		`  defaultExport = defaultExport.default;`,
		`}`
	] : [
		`import * as module from ${JSON.stringify(normalizedSpecifier)};`,
		`let defaultExport = "default" in module ? module.default : module;`,
		`for (let index = 0; index < 4 && defaultExport && typeof defaultExport === "object" && "default" in defaultExport; index += 1) {`,
		`  defaultExport = defaultExport.default;`,
		`}`
	];
	const content = [
		`export * from ${JSON.stringify(normalizedSpecifier)};`,
		...defaultForwarder,
		"export { defaultExport as default };",
		""
	].join("\n");
	try {
		if (fs.readFileSync(targetPath, "utf8") === content) return;
	} catch {}
	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.writeFileSync(targetPath, content, "utf8");
}
function ensureOpenClawPluginSdkAlias(distRoot) {
	const pluginSdkDir = path.join(distRoot, "plugin-sdk");
	if (!fs.existsSync(pluginSdkDir)) return;
	const aliasDir = path.join(distRoot, "extensions", "node_modules", "openclaw");
	const pluginSdkAliasDir = path.join(aliasDir, "plugin-sdk");
	writeRuntimeJsonFile(path.join(aliasDir, "package.json"), {
		name: "openclaw",
		type: "module",
		exports: {
			"./plugin-sdk": "./plugin-sdk/index.js",
			"./plugin-sdk/*": "./plugin-sdk/*.js"
		}
	});
	try {
		if (fs.existsSync(pluginSdkAliasDir) && !fs.lstatSync(pluginSdkAliasDir).isDirectory()) fs.rmSync(pluginSdkAliasDir, {
			recursive: true,
			force: true
		});
	} catch {}
	fs.mkdirSync(pluginSdkAliasDir, { recursive: true });
	for (const entry of fs.readdirSync(pluginSdkDir, { withFileTypes: true })) {
		if (!entry.isFile() || path.extname(entry.name) !== ".js") continue;
		writeRuntimeModuleWrapper(path.join(pluginSdkDir, entry.name), path.join(pluginSdkAliasDir, entry.name));
	}
}
//#endregion
export { shouldMaterializeBundledRuntimeMirrorDistFile as _, refreshBundledPluginRuntimeMirrorRoot as a, installBundledRuntimeDeps as c, repairBundledRuntimeDepsInstallRootAsync as d, resolveBundledRuntimeDependencyInstallRootPlan as f, scanBundledPluginRuntimeDeps as g, resolveBundledRuntimeDependencyPackageRoot as h, precomputeBundledRuntimeMirrorMetadata as i, materializeBundledRuntimeMirrorDistFile as l, resolveBundledRuntimeDependencyPackageInstallRootPlan as m, prepareBundledPluginRuntimeRoot as n, createBundledRuntimeDepsWritableInstallSpecs as o, resolveBundledRuntimeDependencyPackageInstallRoot as p, copyBundledPluginRuntimeRoot as r, ensureBundledPluginRuntimeDeps as s, isBuiltBundledPluginRuntimeRoot as t, registerBundledRuntimeDependencyNodePath as u, withBundledRuntimeDepsFilesystemLock as v, createLowDiskSpaceWarning as y };
