import "./chunk-B3rcqzHX.js";
import "./conversation-label-generator-BK7bqeAr.js";
//#region src/plugin-sdk/reply-dispatch-runtime.ts
const dispatchReplyWithBufferedBlockDispatcher = async (params) => {
	const { dispatchReplyWithBufferedBlockDispatcher: dispatch } = await import("./provider-dispatcher-DD0fW8CB.js");
	return await dispatch(params);
};
const dispatchReplyWithDispatcher = async (params) => {
	const { dispatchReplyWithDispatcher: dispatch } = await import("./provider-dispatcher-DD0fW8CB.js");
	return await dispatch(params);
};
//#endregion
export { dispatchReplyWithDispatcher as n, dispatchReplyWithBufferedBlockDispatcher as t };
