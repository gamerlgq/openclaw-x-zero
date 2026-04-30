import { n as buildManifestModelProviderConfig } from "./provider-catalog-shared-DyhemWxL.js";
import { t as modelCatalog } from "./openclaw.plugin-DW9TMPE7.js";
//#region extensions/mistral/provider-catalog.ts
function buildMistralProvider() {
	return buildManifestModelProviderConfig({
		providerId: "mistral",
		catalog: modelCatalog.providers.mistral
	});
}
//#endregion
export { buildMistralProvider as t };
