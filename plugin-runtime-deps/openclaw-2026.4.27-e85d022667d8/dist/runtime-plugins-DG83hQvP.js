import { p as resolveUserPath } from "./utils-DvkbxKCZ.js";
import { a as resolveRuntimePluginRegistry } from "./loader-CPsG_3Jg.js";
import { l as getActivePluginRuntimeSubagentMode } from "./runtime-DH5Ph4Z1.js";
import { a as resolveGatewayStartupPluginIds } from "./gateway-startup-plugin-ids-BthrJK4f.js";
//#region src/agents/runtime-plugins.ts
function resolveRuntimePluginIds(params) {
	if (!params.config) return;
	return resolveGatewayStartupPluginIds({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: process.env
	});
}
function ensureRuntimePluginsLoaded(params) {
	const workspaceDir = typeof params.workspaceDir === "string" && params.workspaceDir.trim() ? resolveUserPath(params.workspaceDir) : void 0;
	const allowGatewaySubagentBinding = params.allowGatewaySubagentBinding === true || getActivePluginRuntimeSubagentMode() === "gateway-bindable";
	resolveRuntimePluginRegistry({
		config: params.config,
		workspaceDir,
		...params.config ? { onlyPluginIds: [...resolveRuntimePluginIds({
			config: params.config,
			workspaceDir
		}) ?? []] } : {},
		runtimeOptions: allowGatewaySubagentBinding ? { allowGatewaySubagentBinding: true } : void 0
	});
}
//#endregion
export { ensureRuntimePluginsLoaded as t };
