import { t as createPluginRuntimeStore } from "./runtime-store-CmV0OsX5.js";
import "./channel-policy-C8rNV1ba.js";
import "./channel-pairing-CAfTji5n.js";
import "./inbound-reply-dispatch-B2P5Fv6l.js";
import "./ssrf-runtime-CCfq5mmu.js";
//#region extensions/nextcloud-talk/src/runtime.ts
const { setRuntime: setNextcloudTalkRuntime, getRuntime: getNextcloudTalkRuntime } = createPluginRuntimeStore({
	pluginId: "nextcloud-talk",
	errorMessage: "Nextcloud Talk runtime not initialized"
});
//#endregion
export { setNextcloudTalkRuntime as n, getNextcloudTalkRuntime as t };
