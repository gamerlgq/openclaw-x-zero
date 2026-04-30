import { t as createZalouserPluginBase } from "./shared-TFcijSFm.js";
import { n as zalouserSetupAdapter } from "./setup-core-D84GkiYZ.js";
import { t as zalouserSetupWizard } from "./setup-surface-B6a7RL7R.js";
//#region extensions/zalouser/src/channel.setup.ts
const zalouserSetupPlugin = { ...createZalouserPluginBase({
	setupWizard: zalouserSetupWizard,
	setup: zalouserSetupAdapter
}) };
//#endregion
export { zalouserSetupPlugin as t };
