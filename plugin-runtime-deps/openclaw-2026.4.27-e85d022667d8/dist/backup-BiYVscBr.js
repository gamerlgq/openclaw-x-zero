import { r as writeRuntimeJson } from "./runtime-CIJX7ulQ.js";
import { n as formatBackupCreateSummary, t as createBackupArchive } from "./backup-create-C4vcvLiT.js";
//#region src/commands/backup.ts
let backupVerifyRuntimePromise;
function loadBackupVerifyRuntime() {
	backupVerifyRuntimePromise ??= import("./backup-verify-D_Dgl-7R.js");
	return backupVerifyRuntimePromise;
}
async function backupCreateCommand(runtime, opts = {}) {
	const result = await createBackupArchive(opts);
	if (opts.verify && !opts.dryRun) {
		const { backupVerifyCommand } = await loadBackupVerifyRuntime();
		await backupVerifyCommand({
			...runtime,
			log: () => {}
		}, {
			archive: result.archivePath,
			json: false
		});
		result.verified = true;
	}
	if (opts.json) writeRuntimeJson(runtime, result);
	else runtime.log(formatBackupCreateSummary(result).join("\n"));
	return result;
}
//#endregion
export { backupCreateCommand as t };
