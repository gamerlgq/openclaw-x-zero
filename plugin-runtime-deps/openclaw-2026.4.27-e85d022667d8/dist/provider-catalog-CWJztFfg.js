import { n as buildManifestModelProviderConfig } from "./provider-catalog-shared-DyhemWxL.js";
//#region extensions/nvidia/openclaw.plugin.json
var modelCatalog = {
	"providers": { "nvidia": {
		"baseUrl": "https://integrate.api.nvidia.com/v1",
		"api": "openai-completions",
		"models": [
			{
				"id": "nvidia/nemotron-3-super-120b-a12b",
				"name": "NVIDIA Nemotron 3 Super 120B",
				"input": ["text"],
				"contextWindow": 262144,
				"maxTokens": 8192,
				"cost": {
					"input": 0,
					"output": 0,
					"cacheRead": 0,
					"cacheWrite": 0
				}
			},
			{
				"id": "moonshotai/kimi-k2.5",
				"name": "Kimi K2.5",
				"input": ["text"],
				"contextWindow": 262144,
				"maxTokens": 8192,
				"cost": {
					"input": 0,
					"output": 0,
					"cacheRead": 0,
					"cacheWrite": 0
				}
			},
			{
				"id": "minimaxai/minimax-m2.5",
				"name": "MiniMax M2.5",
				"input": ["text"],
				"contextWindow": 196608,
				"maxTokens": 8192,
				"cost": {
					"input": 0,
					"output": 0,
					"cacheRead": 0,
					"cacheWrite": 0
				}
			},
			{
				"id": "z-ai/glm5",
				"name": "GLM-5",
				"input": ["text"],
				"contextWindow": 202752,
				"maxTokens": 8192,
				"cost": {
					"input": 0,
					"output": 0,
					"cacheRead": 0,
					"cacheWrite": 0
				}
			}
		]
	} },
	"discovery": { "nvidia": "static" }
};
//#endregion
//#region extensions/nvidia/provider-catalog.ts
function buildNvidiaProvider() {
	return buildManifestModelProviderConfig({
		providerId: "nvidia",
		catalog: modelCatalog.providers.nvidia
	});
}
//#endregion
export { buildNvidiaProvider as t };
