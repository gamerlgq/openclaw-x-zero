import { t as definePluginEntry } from "../../plugin-entry-DyZc6JGI.js";
import { t as createExaWebSearchProvider } from "../../exa-web-search-provider-Bn1C3lqa.js";
//#region extensions/exa/index.ts
var exa_default = definePluginEntry({
	id: "exa",
	name: "Exa Plugin",
	description: "Bundled Exa web search plugin",
	register(api) {
		api.registerWebSearchProvider(createExaWebSearchProvider());
	}
});
//#endregion
export { exa_default as default };
