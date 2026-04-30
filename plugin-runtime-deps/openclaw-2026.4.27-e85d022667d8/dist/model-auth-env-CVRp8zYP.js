import { r as normalizeProviderId } from "./provider-id-DMUF3fJY.js";
import { t as getShellEnvAppliedKeys } from "./shell-env-Dv6Cj1cU.js";
import { r as resolveProviderIdForAuth } from "./provider-auth-aliases-D8dRMPdB.js";
import { t as CORE_PROVIDER_AUTH_ENV_VAR_CANDIDATES } from "./provider-env-vars-DOy0Czuc.js";
import { a as resolvePluginSetupProvider } from "./setup-registry-CMHsMQMP.js";
import { n as GCP_VERTEX_CREDENTIALS_MARKER, v as resolveProviderEnvApiKeyCandidates } from "./model-auth-markers-BDTl9MEF.js";
import { t as normalizeOptionalSecretInput } from "./normalize-secret-input-BBVMiIqq.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
//#region src/agents/model-auth-env.ts
function hasGoogleVertexAdcCredentials(env) {
	const explicitCredentialsPath = normalizeOptionalSecretInput(env.GOOGLE_APPLICATION_CREDENTIALS);
	if (explicitCredentialsPath) return fs.existsSync(explicitCredentialsPath);
	const homeDir = normalizeOptionalSecretInput(env.HOME) ?? os.homedir();
	return fs.existsSync(path.join(homeDir, ".config", "gcloud", "application_default_credentials.json"));
}
function resolveGoogleVertexEnvApiKey(env) {
	const explicitApiKey = normalizeOptionalSecretInput(env.GOOGLE_CLOUD_API_KEY);
	if (explicitApiKey) return explicitApiKey;
	const hasProject = Boolean(env.GOOGLE_CLOUD_PROJECT || env.GCLOUD_PROJECT);
	const hasLocation = Boolean(env.GOOGLE_CLOUD_LOCATION);
	return hasProject && hasLocation && hasGoogleVertexAdcCredentials(env) ? GCP_VERTEX_CREDENTIALS_MARKER : void 0;
}
function resolveEnvApiKey(provider, env = process.env) {
	const rawProvider = normalizeProviderId(provider);
	const applied = new Set(getShellEnvAppliedKeys());
	const pick = (envVar) => {
		const value = normalizeOptionalSecretInput(env[envVar]);
		if (!value) return null;
		return {
			apiKey: value,
			source: applied.has(envVar) ? `shell env: ${envVar}` : `env: ${envVar}`
		};
	};
	const coreCandidates = Object.hasOwn(CORE_PROVIDER_AUTH_ENV_VAR_CANDIDATES, rawProvider) ? CORE_PROVIDER_AUTH_ENV_VAR_CANDIDATES[rawProvider] : void 0;
	if (Array.isArray(coreCandidates)) for (const envVar of coreCandidates) {
		const resolved = pick(envVar);
		if (resolved) return resolved;
	}
	if (rawProvider === "google-vertex") {
		const envKey = resolveGoogleVertexEnvApiKey(env);
		if (envKey) return {
			apiKey: envKey,
			source: "gcloud adc"
		};
	}
	const candidateMap = resolveProviderEnvApiKeyCandidates({ env });
	const normalized = resolveProviderIdForAuth(rawProvider, { env });
	if (normalized === rawProvider && coreCandidates) return null;
	const candidates = Object.hasOwn(candidateMap, normalized) ? candidateMap[normalized] : void 0;
	if (Array.isArray(candidates)) {
		for (const envVar of candidates) {
			const resolved = pick(envVar);
			if (resolved) return resolved;
		}
		return null;
	}
	if (normalized === "google-vertex") {
		const envKey = resolveGoogleVertexEnvApiKey(env);
		if (!envKey) return null;
		return {
			apiKey: envKey,
			source: "gcloud adc"
		};
	}
	const setupProvider = resolvePluginSetupProvider({
		provider: normalized,
		env
	});
	if (setupProvider?.resolveConfigApiKey) {
		const resolved = setupProvider.resolveConfigApiKey({
			provider: normalized,
			env
		});
		if (resolved?.trim()) return {
			apiKey: resolved,
			source: resolved === "gcp-vertex-credentials" ? "gcloud adc" : "env"
		};
	}
	return null;
}
//#endregion
export { resolveEnvApiKey as t };
