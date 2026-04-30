import "./types.secrets-BHp0Y_k0.js";
import "./ref-contract-DtvCiPbj.js";
import "./provider-env-vars-DOy0Czuc.js";
import { n as ensureAuthProfileStore } from "./store-lvugMVfA.js";
import { t as resolveOpenClawAgentDir } from "./agent-paths-B_wzQ6Ed.js";
import "./model-auth-markers-BDTl9MEF.js";
import { t as resolveEnvApiKey } from "./model-auth-env-CVRp8zYP.js";
import "./models-config.providers.secrets-44nBQZt2.js";
import { t as resolveApiKeyForProfile } from "./oauth-e66Uo9Vj.js";
import { n as listProfilesForProvider } from "./profile-list-DRJDaM7Y.js";
import "./repair-xAA6u314.js";
import { n as resolveAuthProfileOrder } from "./order-C6fBUbU3.js";
import "./profiles-JhylvYqI.js";
import "./provider-auth-input-CBRMoJbd.js";
import "./provider-auth-helpers-C_Qhb-di.js";
import "./provider-api-key-auth-I14h04HK.js";
import { createHash, randomBytes } from "node:crypto";
//#region src/plugin-sdk/oauth-utils.ts
/** Encode a flat object as application/x-www-form-urlencoded form data. */
function toFormUrlEncoded(data) {
	return Object.entries(data).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}
/** Generate a PKCE verifier/challenge pair suitable for OAuth authorization flows. */
function generatePkceVerifierChallenge() {
	const verifier = randomBytes(32).toString("base64url");
	return {
		verifier,
		challenge: createHash("sha256").update(verifier).digest("base64url")
	};
}
/** Generate a PKCE verifier/challenge pair with a 64-character hex verifier. */
function generateHexPkceVerifierChallenge() {
	const verifier = randomBytes(32).toString("hex");
	return {
		verifier,
		challenge: createHash("sha256").update(verifier).digest("base64url")
	};
}
//#endregion
//#region src/plugin-sdk/provider-auth.ts
function isProviderApiKeyConfigured(params) {
	if (resolveEnvApiKey(params.provider)?.apiKey) return true;
	const agentDir = params.agentDir?.trim();
	if (!agentDir) return false;
	return listProfilesForProvider(ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false }), params.provider).length > 0;
}
function listUsableProviderAuthProfileIds(params) {
	try {
		const agentDir = params.agentDir?.trim() || resolveOpenClawAgentDir();
		const store = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
		return {
			agentDir,
			profileIds: resolveAuthProfileOrder({
				cfg: params.cfg,
				store,
				provider: params.provider
			})
		};
	} catch {
		return {
			agentDir: "",
			profileIds: []
		};
	}
}
function isProviderAuthProfileConfigured(params) {
	return listUsableProviderAuthProfileIds(params).profileIds.length > 0;
}
async function resolveProviderAuthProfileApiKey(params) {
	const { agentDir, profileIds } = listUsableProviderAuthProfileIds(params);
	if (!agentDir || profileIds.length === 0) return;
	const store = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
	for (const profileId of profileIds) {
		const resolved = await resolveApiKeyForProfile({
			cfg: params.cfg,
			store,
			agentDir,
			profileId
		});
		if (resolved?.apiKey) return resolved.apiKey;
	}
}
//#endregion
export { generateHexPkceVerifierChallenge as a, resolveProviderAuthProfileApiKey as i, isProviderAuthProfileConfigured as n, generatePkceVerifierChallenge as o, listUsableProviderAuthProfileIds as r, toFormUrlEncoded as s, isProviderApiKeyConfigured as t };
