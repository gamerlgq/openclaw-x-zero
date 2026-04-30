import { i as formatErrorMessage } from "./errors-g8SYDTCe.js";
import { r as loadInstalledPluginIndexInstallRecords } from "./manifest-registry-adU8lVLL.js";
import { b as refreshPluginRegistry } from "./plugin-registry-Bjn9rPwy.js";
import "./installed-plugin-index-records-D8w5X7uR.js";
//#region src/cli/plugins-registry-refresh.ts
async function refreshPluginRegistryAfterConfigMutation(params) {
	try {
		const installRecords = params.installRecords ?? await loadInstalledPluginIndexInstallRecords(params.env ? { env: params.env } : {});
		await refreshPluginRegistry({
			config: params.config,
			reason: params.reason,
			installRecords,
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			...params.env ? { env: params.env } : {}
		});
	} catch (error) {
		params.logger?.warn?.(`Plugin registry refresh failed: ${formatErrorMessage(error)}`);
	}
}
//#endregion
export { refreshPluginRegistryAfterConfigMutation as t };
