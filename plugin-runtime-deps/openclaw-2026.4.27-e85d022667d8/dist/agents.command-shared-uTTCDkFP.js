import { a as getLogger } from "./logger-B7txuiSU.js";
import { c as normalizeAgentId } from "./session-key-C6F-NnIG.js";
import { S as resolveDefaultAgentId } from "./agent-scope-RNt6KatQ.js";
import { o as resolveStoredSessionOwnerAgentId } from "./combined-store-gateway-D6wKl8dT.js";
import { u as resolveStorePath } from "./paths-Bg_QeV2r.js";
import { o as updateSessionStore } from "./store-BNAn-6FU.js";
import "./sessions-D8ANGXQF.js";
import { n as requireValidConfigSnapshot, t as requireValidConfigFileSnapshot$1 } from "./config-validation-h0fosIZf.js";
//#region src/commands/agents.command-shared.ts
function createQuietRuntime(runtime) {
	return {
		...runtime,
		log: () => {}
	};
}
async function requireValidConfigFileSnapshot(runtime) {
	return await requireValidConfigFileSnapshot$1(runtime);
}
async function requireValidConfig(runtime) {
	return await requireValidConfigSnapshot(runtime);
}
/** Purge session store entries for a deleted agent (#65524). Best-effort. */
async function purgeAgentSessionStoreEntries(cfg, agentId) {
	try {
		const normalizedAgentId = normalizeAgentId(agentId);
		const storeConfig = cfg.session?.store;
		const storeAgentId = typeof storeConfig === "string" && storeConfig.includes("{agentId}") ? normalizedAgentId : normalizeAgentId(resolveDefaultAgentId(cfg));
		await updateSessionStore(resolveStorePath(cfg.session?.store, { agentId: normalizedAgentId }), (store) => {
			for (const key of Object.keys(store)) if (resolveStoredSessionOwnerAgentId({
				cfg,
				agentId: storeAgentId,
				sessionKey: key
			}) === normalizedAgentId) delete store[key];
		});
	} catch (err) {
		getLogger().debug("session store purge skipped during agent delete", err);
	}
}
//#endregion
export { requireValidConfigFileSnapshot as i, purgeAgentSessionStoreEntries as n, requireValidConfig as r, createQuietRuntime as t };
