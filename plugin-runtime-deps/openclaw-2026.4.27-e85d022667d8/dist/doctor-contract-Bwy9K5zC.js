import { r as createLegacyPrivateNetworkDoctorContract } from "./ssrf-policy-BHYt5vt6.js";
import "./ssrf-runtime-CCfq5mmu.js";
//#region extensions/tlon/src/doctor-contract.ts
const contract = createLegacyPrivateNetworkDoctorContract({ channelKey: "tlon" });
const legacyConfigRules = contract.legacyConfigRules;
const normalizeCompatibilityConfig = contract.normalizeCompatibilityConfig;
//#endregion
export { normalizeCompatibilityConfig as n, legacyConfigRules as t };
