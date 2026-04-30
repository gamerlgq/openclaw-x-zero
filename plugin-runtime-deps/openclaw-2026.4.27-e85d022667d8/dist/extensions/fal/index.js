import { t as definePluginEntry } from "../../plugin-entry-DyZc6JGI.js";
import { n as buildFalImageGenerationProvider } from "../../image-generation-provider-D9XI0vIA.js";
import { t as createFalProvider } from "../../provider-registration-DbTu6Vdl.js";
import { n as buildFalVideoGenerationProvider } from "../../video-generation-provider-C5SK1wgQ.js";
var fal_default = definePluginEntry({
	id: "fal",
	name: "fal Provider",
	description: "Bundled fal image and video generation provider",
	register(api) {
		api.registerProvider(createFalProvider());
		api.registerImageGenerationProvider(buildFalImageGenerationProvider());
		api.registerVideoGenerationProvider(buildFalVideoGenerationProvider());
	}
});
//#endregion
export { fal_default as default };
