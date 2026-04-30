import { i as getRuntimeConfig } from "./io-B4W7YRox.js";
//#region src/gateway/server-model-catalog.ts
async function __resetModelCatalogCacheForTest() {
	const { resetModelCatalogCacheForTest } = await import("./model-catalog-BfBjZIMO.js");
	resetModelCatalogCacheForTest();
}
async function loadGatewayModelCatalog(params) {
	const { loadModelCatalog } = await import("./model-catalog-BfBjZIMO.js");
	return await loadModelCatalog({ config: (params?.getConfig ?? getRuntimeConfig)() });
}
//#endregion
export { loadGatewayModelCatalog as n, __resetModelCatalogCacheForTest as t };
