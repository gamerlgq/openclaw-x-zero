import { r as createLegacyPrivateNetworkDoctorContract } from "./ssrf-policy-BHYt5vt6.js";
import "./ssrf-runtime-CCfq5mmu.js";
//#region extensions/mattermost/src/doctor-contract.ts
const contract = createLegacyPrivateNetworkDoctorContract({ channelKey: "mattermost" });
const legacyConfigRules = contract.legacyConfigRules;
const normalizeCompatibilityConfig = contract.normalizeCompatibilityConfig;
//#endregion
export { normalizeCompatibilityConfig as n, legacyConfigRules as t };
