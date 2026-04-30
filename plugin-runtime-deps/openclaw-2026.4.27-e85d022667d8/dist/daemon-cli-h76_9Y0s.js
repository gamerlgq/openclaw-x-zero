import { t as formatDocsLink } from "./links-BszRQhGa.js";
import { r as theme } from "./theme-B128avno.js";
import { t as addGatewayServiceCommands } from "./register-service-commands-BYEratBx.js";
import "./install-B60EUIuw.js";
import "./lifecycle-DInsXhBY.js";
import "./status-DmOh0QpQ.js";
//#region src/cli/daemon-cli/register.ts
function registerDaemonCli(program) {
	addGatewayServiceCommands(program.command("daemon").description("Manage the Gateway service (launchd/systemd/schtasks)").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/gateway", "docs.openclaw.ai/cli/gateway")}\n`), { statusDescription: "Show service install status + probe connectivity/capability" });
}
//#endregion
export { registerDaemonCli as t };
