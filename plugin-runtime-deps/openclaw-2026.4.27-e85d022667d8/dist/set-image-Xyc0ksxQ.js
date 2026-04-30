import { n as resolveAgentModelPrimaryValue } from "./model-input-Ba1eTv7s.js";
import { n as logConfigUpdated } from "./logging-DC5Z7XZc.js";
import { t as applyDefaultModelPrimaryUpdate, u as updateConfig } from "./shared-YnyPjxBf.js";
//#region src/commands/models/set-image.ts
async function modelsSetImageCommand(modelRaw, runtime) {
	const updated = await updateConfig((cfg) => {
		return applyDefaultModelPrimaryUpdate({
			cfg,
			modelRaw,
			field: "imageModel"
		});
	});
	logConfigUpdated(runtime);
	runtime.log(`Image model: ${resolveAgentModelPrimaryValue(updated.agents?.defaults?.imageModel) ?? modelRaw}`);
}
//#endregion
export { modelsSetImageCommand };
