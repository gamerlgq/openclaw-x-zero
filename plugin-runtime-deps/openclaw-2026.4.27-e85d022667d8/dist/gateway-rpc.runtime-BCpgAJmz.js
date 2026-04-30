import { i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES } from "./client-info-BhnDRj_s.js";
import { r as callGateway } from "./call-xuTtjcDL.js";
import { n as withProgress } from "./progress-DEutg9EU.js";
//#region src/cli/gateway-rpc.runtime.ts
async function callGatewayFromCliRuntime(method, opts, params, extra) {
	const showProgress = extra?.progress ?? opts.json !== true;
	return await withProgress({
		label: `Gateway ${method}`,
		indeterminate: true,
		enabled: showProgress
	}, async () => await callGateway({
		url: opts.url,
		token: opts.token,
		method,
		params,
		expectFinal: extra?.expectFinal ?? Boolean(opts.expectFinal),
		timeoutMs: Number(opts.timeout ?? 1e4),
		clientName: GATEWAY_CLIENT_NAMES.CLI,
		mode: GATEWAY_CLIENT_MODES.CLI
	}));
}
//#endregion
export { callGatewayFromCliRuntime };
