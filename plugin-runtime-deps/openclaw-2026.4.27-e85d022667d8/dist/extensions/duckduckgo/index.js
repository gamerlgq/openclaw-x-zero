import { t as definePluginEntry } from "../../plugin-entry-DyZc6JGI.js";
import { t as createDuckDuckGoWebSearchProvider } from "../../ddg-search-provider-BbJ4QrwX.js";
//#region extensions/duckduckgo/index.ts
var duckduckgo_default = definePluginEntry({
	id: "duckduckgo",
	name: "DuckDuckGo Plugin",
	description: "Bundled DuckDuckGo web search plugin",
	register(api) {
		api.registerWebSearchProvider(createDuckDuckGoWebSearchProvider());
	}
});
//#endregion
export { duckduckgo_default as default };
