import { t as resolveMemoryBackendConfig } from "./backend-config-DGhc9Ni_.js";
import "./memory-core-host-runtime-files-43Oo8RRu.js";
import { n as getMemorySearchManager, t as closeAllMemorySearchManagers } from "./memory-Dnl74Q8s.js";
//#region extensions/memory-core/src/runtime-provider.ts
const memoryRuntime = {
	async getMemorySearchManager(params) {
		const { manager, error } = await getMemorySearchManager(params);
		return {
			manager,
			error
		};
	},
	resolveMemoryBackendConfig(params) {
		return resolveMemoryBackendConfig(params);
	},
	async closeAllMemorySearchManagers() {
		await closeAllMemorySearchManagers();
	}
};
//#endregion
export { memoryRuntime as t };
