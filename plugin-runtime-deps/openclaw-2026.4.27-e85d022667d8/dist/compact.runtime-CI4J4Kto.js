//#region src/agents/pi-embedded-runner/compact.runtime.ts
let compactRuntimePromise = null;
function loadCompactRuntime() {
	compactRuntimePromise ??= import("./compact-CQI5w8N3.js");
	return compactRuntimePromise;
}
async function compactEmbeddedPiSessionDirect(...args) {
	const { compactEmbeddedPiSessionDirect } = await loadCompactRuntime();
	return compactEmbeddedPiSessionDirect(...args);
}
//#endregion
export { compactEmbeddedPiSessionDirect };
