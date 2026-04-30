import "./net-DDjdGYkE.js";
import "./auth-DMMyU_8y.js";
import "./client-C_yF1Jx2.js";
import "./protocol-BvHKcb_2.js";
import "./operator-approvals-client-kPeM-ghG.js";
import "./gateway-rpc-C75nvMsR.js";
import "./node-command-policy-DQCRGepm.js";
import "./nodes.helpers-BOn4w5OI.js";
import "./startup-auth-ytEf8nHI.js";
//#region src/gateway/channel-status-patches.ts
function createConnectedChannelStatusPatch(at = Date.now()) {
	return {
		connected: true,
		lastConnectedAt: at,
		lastEventAt: at
	};
}
function createTransportActivityStatusPatch(at = Date.now()) {
	return { lastTransportActivityAt: at };
}
//#endregion
export { createTransportActivityStatusPatch as n, createConnectedChannelStatusPatch as t };
