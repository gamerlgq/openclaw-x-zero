import { c as logToolLoopAction } from "./diagnostic-ZVoTn1JP.js";
import { n as getDiagnosticSessionState } from "./diagnostic-session-state-DC-5fSCi.js";
import { n as recordToolCall, r as recordToolCallOutcome, t as detectToolCallLoop } from "./tool-loop-detection-Bkgab8eE.js";
//#region src/agents/pi-tools.before-tool-call.runtime.ts
const beforeToolCallRuntime = {
	getDiagnosticSessionState,
	logToolLoopAction,
	detectToolCallLoop,
	recordToolCall,
	recordToolCallOutcome
};
//#endregion
export { beforeToolCallRuntime };
