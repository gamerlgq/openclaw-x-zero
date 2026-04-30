import { t as formatDocsLink } from "./links-BszRQhGa.js";
import { r as theme } from "./theme-B128avno.js";
import { n as defaultRuntime } from "./runtime-CIJX7ulQ.js";
import { n as runCommandWithRuntime } from "./cli-utils-BE3eZBkQ.js";
import { n as configureCommandFromSectionsArg, o as CONFIGURE_WIZARD_SECTIONS } from "./configure-DNxkB4TW.js";
//#region src/cli/program/register.configure.ts
function registerConfigureCommand(program) {
	program.command("configure").description("Interactive configuration for credentials, channels, gateway, and agent defaults").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/configure", "docs.openclaw.ai/cli/configure")}\n`).option("--section <section>", `Configuration sections (repeatable). Options: ${CONFIGURE_WIZARD_SECTIONS.join(", ")}`, (value, previous) => [...previous, value], []).action(async (opts) => {
		await runCommandWithRuntime(defaultRuntime, async () => {
			await configureCommandFromSectionsArg(opts.section, defaultRuntime);
		});
	});
}
//#endregion
export { registerConfigureCommand };
