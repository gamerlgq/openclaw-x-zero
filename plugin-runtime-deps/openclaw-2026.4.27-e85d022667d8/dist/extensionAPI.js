import { b as resolveAgentDir, x as resolveAgentWorkspaceDir } from "./agent-scope-RNt6KatQ.js";
import { n as DEFAULT_MODEL, r as DEFAULT_PROVIDER } from "./defaults-WmkV2Z8L.js";
import { i as resolveSessionFilePath, u as resolveStorePath } from "./paths-Bg_QeV2r.js";
import { t as loadSessionStore } from "./store-load-Ctb7CJ9w.js";
import { i as saveSessionStore } from "./store-BNAn-6FU.js";
import "./sessions-D8ANGXQF.js";
import { p as resolveThinkingDefault } from "./model-selection-DGI1ibK2.js";
import { t as resolveAgentTimeoutMs } from "./timeout-CMjJybYF.js";
import { n as resolveAgentIdentity } from "./identity-CIX88Or7.js";
import { l as ensureAgentWorkspace } from "./workspace-ClacWI75.js";
import { t as runEmbeddedPiAgent } from "./pi-embedded-CLyF5vpj.js";
//#region src/extensionAPI.ts
if (process.env.VITEST !== "true" && process.env.OPENCLAW_SUPPRESS_EXTENSION_API_WARNING !== "1") process.emitWarning("openclaw/extension-api is deprecated. Migrate to api.runtime.agent.* or focused openclaw/plugin-sdk/<subpath> imports. See https://docs.openclaw.ai/plugins/sdk-migration", {
	code: "OPENCLAW_EXTENSION_API_DEPRECATED",
	detail: "This compatibility bridge is temporary. Bundled plugins should use the injected plugin runtime instead of importing host-side agent helpers directly. Migration guide: https://docs.openclaw.ai/plugins/sdk-migration"
});
//#endregion
export { DEFAULT_MODEL, DEFAULT_PROVIDER, ensureAgentWorkspace, loadSessionStore, resolveAgentDir, resolveAgentIdentity, resolveAgentTimeoutMs, resolveAgentWorkspaceDir, resolveSessionFilePath, resolveStorePath, resolveThinkingDefault, runEmbeddedPiAgent, saveSessionStore };
