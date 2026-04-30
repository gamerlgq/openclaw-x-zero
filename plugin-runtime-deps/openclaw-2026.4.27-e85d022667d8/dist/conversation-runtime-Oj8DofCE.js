import "./session-binding-service-DZ5PKgpI.js";
import "./binding-registry-CsWPs7PV.js";
import "./conversation-binding-eSKZ_Dlk.js";
import "./session-D5rAz7hw.js";
import "./pairing-store-CkcMrgB2.js";
import "./dm-policy-shared-xewOEgkH.js";
import "./binding-targets-7WQW2_S4.js";
import "./binding-routing-DzFH-7-S.js";
import "./thread-bindings-policy-DU_JKiuL.js";
import "./pairing-labels-C77O9_qt.js";
//#region src/channels/session-meta.ts
let inboundSessionRuntimePromise = null;
function loadInboundSessionRuntime() {
	inboundSessionRuntimePromise ??= import("./inbound.runtime-LSHe2Sau.js");
	return inboundSessionRuntimePromise;
}
async function recordInboundSessionMetaSafe(params) {
	const runtime = await loadInboundSessionRuntime();
	const storePath = runtime.resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
	try {
		await runtime.recordSessionMetaFromInbound({
			storePath,
			sessionKey: params.sessionKey,
			ctx: params.ctx
		});
	} catch (err) {
		params.onError?.(err);
	}
}
//#endregion
export { recordInboundSessionMetaSafe as t };
