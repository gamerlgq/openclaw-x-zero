import { r as normalizeProviderId } from "./provider-id-DMUF3fJY.js";
import "./provider-model-shared-C3XFO8Tx.js";
import "./provider-stream-shared-g-_SthWG.js";
import { i as streamWithPayloadPatch } from "./moonshot-thinking-stream-wrappers-CGPc3Pj5.js";
import { t as isFireworksKimiModelId } from "./model-id-czgtd6oy.js";
import { streamSimple } from "@mariozechner/pi-ai";
//#region extensions/fireworks/stream.ts
function isFireworksProviderId(providerId) {
	const normalized = normalizeProviderId(providerId);
	return normalized === "fireworks" || normalized === "fireworks-ai";
}
function createFireworksKimiThinkingDisabledWrapper(baseStreamFn) {
	const underlying = baseStreamFn ?? streamSimple;
	return (model, context, options) => streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
		payloadObj.thinking = { type: "disabled" };
		delete payloadObj.reasoning;
		delete payloadObj.reasoning_effort;
		delete payloadObj.reasoningEffort;
	});
}
function wrapFireworksProviderStream(ctx) {
	if (!isFireworksProviderId(ctx.provider) || ctx.model?.api !== "openai-completions" || !isFireworksKimiModelId(ctx.modelId)) return;
	return createFireworksKimiThinkingDisabledWrapper(ctx.streamFn);
}
//#endregion
export { wrapFireworksProviderStream as n, createFireworksKimiThinkingDisabledWrapper as t };
