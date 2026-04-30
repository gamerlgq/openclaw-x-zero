import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-Bje8XVt9.js";
import { _ as resolveStateDir } from "./paths-B2cMK-wd.js";
import { n as saveJsonFile, t as loadJsonFile } from "./json-file-Cq418mQ6.js";
import { n as resolveProviderEndpoint } from "./provider-attribution-C8_-Lqv3.js";
import "./json-store-fHNTvZoL.js";
import "./provider-model-shared-C3XFO8Tx.js";
import "./string-coerce-runtime-DtaB6Rx4.js";
import "./state-paths-BoXZ85Gd.js";
import path from "node:path";
//#region extensions/github-copilot/token.ts
const COPILOT_TOKEN_URL = "https://api.github.com/copilot_internal/v2/token";
const COPILOT_EDITOR_VERSION = "vscode/1.96.2";
const COPILOT_USER_AGENT = "GitHubCopilotChat/0.26.7";
const COPILOT_EDITOR_PLUGIN_VERSION = "copilot-chat/0.35.0";
const COPILOT_GITHUB_API_VERSION = "2025-04-01";
const DEFAULT_COPILOT_API_BASE_URL = "https://api.individual.githubcopilot.com";
function buildCopilotIdeHeaders(params = {}) {
	return {
		"Editor-Version": COPILOT_EDITOR_VERSION,
		"Editor-Plugin-Version": COPILOT_EDITOR_PLUGIN_VERSION,
		"User-Agent": COPILOT_USER_AGENT,
		...params.includeApiVersion ? { "X-Github-Api-Version": COPILOT_GITHUB_API_VERSION } : {}
	};
}
function resolveCopilotTokenCachePath(env = process.env) {
	return path.join(resolveStateDir(env), "credentials", "github-copilot.token.json");
}
function isTokenUsable(cache, now = Date.now()) {
	return cache.expiresAt - now > 300 * 1e3;
}
function parseCopilotTokenResponse(value) {
	if (!value || typeof value !== "object") throw new Error("Unexpected response from GitHub Copilot token endpoint");
	const asRecord = value;
	const token = asRecord.token;
	const expiresAt = asRecord.expires_at;
	if (typeof token !== "string" || token.trim().length === 0) throw new Error("Copilot token response missing token");
	let expiresAtMs;
	if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) expiresAtMs = expiresAt < 1e11 ? expiresAt * 1e3 : expiresAt;
	else if (typeof expiresAt === "string" && expiresAt.trim().length > 0) {
		const parsed = Number.parseInt(expiresAt, 10);
		if (!Number.isFinite(parsed)) throw new Error("Copilot token response has invalid expires_at");
		expiresAtMs = parsed < 1e11 ? parsed * 1e3 : parsed;
	} else throw new Error("Copilot token response missing expires_at");
	return {
		token,
		expiresAt: expiresAtMs
	};
}
function resolveCopilotProxyHost(proxyEp) {
	const trimmed = proxyEp.trim();
	if (!trimmed) return null;
	const urlText = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const url = new URL(urlText);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		return normalizeLowercaseStringOrEmpty(url.hostname);
	} catch {
		return null;
	}
}
function deriveCopilotApiBaseUrlFromToken(token) {
	const trimmed = token.trim();
	if (!trimmed) return null;
	const proxyEp = trimmed.match(/(?:^|;)\s*proxy-ep=([^;\s]+)/i)?.[1]?.trim();
	if (!proxyEp) return null;
	const proxyHost = resolveCopilotProxyHost(proxyEp);
	if (!proxyHost) return null;
	const baseUrl = `https://${proxyHost.replace(/^proxy\./i, "api.")}`;
	return resolveProviderEndpoint(baseUrl).endpointClass === "invalid" ? null : baseUrl;
}
async function resolveCopilotApiToken(params) {
	const env = params.env ?? process.env;
	const cachePath = params.cachePath?.trim() || resolveCopilotTokenCachePath(env);
	const loadJsonFileFn = params.loadJsonFileImpl ?? loadJsonFile;
	const saveJsonFileFn = params.saveJsonFileImpl ?? saveJsonFile;
	const cached = loadJsonFileFn(cachePath);
	if (cached && typeof cached.token === "string" && typeof cached.expiresAt === "number") {
		if (isTokenUsable(cached)) return {
			token: cached.token,
			expiresAt: cached.expiresAt,
			source: `cache:${cachePath}`,
			baseUrl: deriveCopilotApiBaseUrlFromToken(cached.token) ?? "https://api.individual.githubcopilot.com"
		};
	}
	const res = await (params.fetchImpl ?? fetch)(COPILOT_TOKEN_URL, {
		method: "GET",
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${params.githubToken}`,
			...buildCopilotIdeHeaders({ includeApiVersion: true })
		}
	});
	if (!res.ok) throw new Error(`Copilot token exchange failed: HTTP ${res.status}`);
	const json = parseCopilotTokenResponse(await res.json());
	const payload = {
		token: json.token,
		expiresAt: json.expiresAt,
		updatedAt: Date.now()
	};
	saveJsonFileFn(cachePath, payload);
	return {
		token: payload.token,
		expiresAt: payload.expiresAt,
		source: `fetched:${COPILOT_TOKEN_URL}`,
		baseUrl: deriveCopilotApiBaseUrlFromToken(payload.token) ?? "https://api.individual.githubcopilot.com"
	};
}
//#endregion
export { deriveCopilotApiBaseUrlFromToken as n, resolveCopilotApiToken as r, DEFAULT_COPILOT_API_BASE_URL as t };
