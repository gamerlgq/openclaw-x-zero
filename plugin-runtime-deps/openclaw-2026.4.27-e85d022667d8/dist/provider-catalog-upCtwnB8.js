import { n as buildManifestModelProviderConfig } from "./provider-catalog-shared-DyhemWxL.js";
import { t as modelCatalog } from "./openclaw.plugin-B7DzCkjl.js";
//#region extensions/together/provider-catalog.ts
function buildTogetherProvider() {
	return buildManifestModelProviderConfig({
		providerId: "together",
		catalog: modelCatalog.providers.together
	});
}
//#endregion
export { buildTogetherProvider as t };
