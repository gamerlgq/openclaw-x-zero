import "./store-lvugMVfA.js";
import { n as resolveAuthProfileMetadata } from "./identity-iuJyEHHr.js";
import "./oauth-e66Uo9Vj.js";
import "./repair-xAA6u314.js";
import "./order-C6fBUbU3.js";
import "./profiles-JhylvYqI.js";
import "./usage-y_h14LHT.js";
//#region src/agents/auth-profiles/display.ts
function resolveAuthProfileDisplayLabel(params) {
	const { displayName, email } = resolveAuthProfileMetadata(params);
	if (displayName) return `${params.profileId} (${displayName})`;
	if (email) return `${params.profileId} (${email})`;
	return params.profileId;
}
//#endregion
export { resolveAuthProfileDisplayLabel as t };
