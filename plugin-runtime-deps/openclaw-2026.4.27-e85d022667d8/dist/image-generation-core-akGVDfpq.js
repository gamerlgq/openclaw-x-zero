import "./subsystem-Izr-DYZz.js";
import "./provider-env-vars-DOy0Czuc.js";
import "./failover-error-9zkewhNf.js";
import "./provider-registry-DgSoOB53.js";
import "./runtime-shared-Cp4Kj9uq.js";
import "./provider-model-shared-C3XFO8Tx.js";
import "./provider-model-defaults-DPRjvvr5.js";
//#region src/plugin-sdk/image-generation-core.ts
let imageGenerationCoreAuthRuntimePromise;
async function loadImageGenerationCoreAuthRuntime() {
	imageGenerationCoreAuthRuntimePromise ??= import("./image-generation-core.auth.runtime-DSxHNpSu.js");
	return imageGenerationCoreAuthRuntimePromise;
}
async function resolveApiKeyForProvider(...args) {
	return (await loadImageGenerationCoreAuthRuntime()).resolveApiKeyForProvider(...args);
}
//#endregion
export { resolveApiKeyForProvider as t };
