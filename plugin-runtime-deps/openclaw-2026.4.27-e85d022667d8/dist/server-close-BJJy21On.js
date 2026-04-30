import { c as normalizeOptionalString } from "./string-coerce-Bje8XVt9.js";
import { t as createSubsystemLogger } from "./subsystem-Izr-DYZz.js";
import { i as listChannelPlugins } from "./registry-dXGKA3mU.js";
import { p as disposeRegisteredAgentHarnesses } from "./loader-CPsG_3Jg.js";
import { m as triggerInternalHook, n as createInternalHookEvent } from "./internal-hooks-DzUdlZ65.js";
import "./plugins-Bc9yusIY.js";
import { i as disposeAllSessionMcpRuntimes } from "./pi-bundle-mcp-runtime-BZXzXJCi.js";
import "./pi-bundle-mcp-tools-DcJhmfN5.js";
//#region src/gateway/server-close.ts
const shutdownLog = createSubsystemLogger("gateway/shutdown");
const GATEWAY_SHUTDOWN_HOOK_TIMEOUT_MS = 1e3;
const GATEWAY_PRE_RESTART_HOOK_TIMEOUT_MS = 1e3;
const WEBSOCKET_CLOSE_GRACE_MS = 1e3;
const WEBSOCKET_CLOSE_FORCE_CONTINUE_MS = 250;
const HTTP_CLOSE_GRACE_MS = 1e3;
const HTTP_CLOSE_FORCE_WAIT_MS = 5e3;
const MCP_RUNTIME_CLOSE_GRACE_MS = 5e3;
const LSP_RUNTIME_CLOSE_GRACE_MS = 5e3;
function createTimeoutRace(timeoutMs, onTimeout) {
	let timer = null;
	timer = setTimeout(() => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		resolve(onTimeout());
	}, timeoutMs);
	timer.unref?.();
	let resolve;
	return {
		promise: new Promise((innerResolve) => {
			resolve = innerResolve;
		}),
		clear() {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		}
	};
}
async function triggerGatewayLifecycleHookWithTimeout(params) {
	let timeout;
	const hookPromise = triggerInternalHook(params.event);
	hookPromise.catch(() => void 0);
	try {
		if (await Promise.race([hookPromise.then(() => "completed"), new Promise((resolve) => {
			timeout = setTimeout(() => resolve("timeout"), params.timeoutMs);
			timeout.unref?.();
		})]) === "timeout") shutdownLog.warn(`${params.hookName} hook timed out after ${params.timeoutMs}ms; continuing shutdown`);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
async function disposeRuntimeWithShutdownGrace(params) {
	const disposePromise = Promise.resolve().then(params.dispose).catch((err) => {
		shutdownLog.warn(`${params.label} runtime disposal failed during shutdown: ${String(err)}`);
	});
	const disposeTimeout = createTimeoutRace(params.graceMs, () => {
		shutdownLog.warn(`${params.label} runtime disposal exceeded ${params.graceMs}ms; continuing shutdown`);
	});
	await Promise.race([disposePromise, disposeTimeout.promise]);
	disposeTimeout.clear();
}
async function disposeAllBundleLspRuntimesOnDemand() {
	const { disposeAllBundleLspRuntimes } = await import("./pi-bundle-lsp-runtime-D11hTfJK.js");
	await disposeAllBundleLspRuntimes();
}
async function stopGmailWatcherOnDemand() {
	const { stopGmailWatcher } = await import("./gmail-watcher-BZXImUee.js");
	await stopGmailWatcher();
}
async function runGatewayClosePrelude(params) {
	params.stopDiagnostics?.();
	params.clearSkillsRefreshTimer?.();
	params.skillsChangeUnsub?.();
	params.disposeAuthRateLimiter?.();
	params.disposeBrowserAuthRateLimiter();
	params.stopModelPricingRefresh?.();
	params.stopChannelHealthMonitor?.();
	params.clearSecretsRuntimeSnapshot?.();
	await params.closeMcpServer?.().catch(() => {});
}
function isServerNotRunningError(err) {
	return Boolean(err && typeof err === "object" && "code" in err && err.code === "ERR_SERVER_NOT_RUNNING");
}
function createGatewayCloseHandler(params) {
	return async (opts) => {
		try {
			const reason = (normalizeOptionalString(opts?.reason) ?? "") || "gateway stopping";
			const restartExpectedMs = typeof opts?.restartExpectedMs === "number" && Number.isFinite(opts.restartExpectedMs) ? Math.max(0, Math.floor(opts.restartExpectedMs)) : null;
			try {
				await triggerGatewayLifecycleHookWithTimeout({
					event: createInternalHookEvent("gateway", "shutdown", "gateway:shutdown", {
						reason,
						restartExpectedMs
					}),
					hookName: "gateway:shutdown",
					timeoutMs: GATEWAY_SHUTDOWN_HOOK_TIMEOUT_MS
				});
				if (restartExpectedMs !== null) await triggerGatewayLifecycleHookWithTimeout({
					event: createInternalHookEvent("gateway", "pre-restart", "gateway:pre-restart", {
						reason,
						restartExpectedMs
					}),
					hookName: "gateway:pre-restart",
					timeoutMs: GATEWAY_PRE_RESTART_HOOK_TIMEOUT_MS
				});
			} catch {}
			if (params.bonjourStop) try {
				await params.bonjourStop();
			} catch {}
			if (params.tailscaleCleanup) await params.tailscaleCleanup();
			if (params.canvasHost) try {
				await params.canvasHost.close();
			} catch {}
			if (params.canvasHostServer) try {
				await params.canvasHostServer.close();
			} catch {}
			for (const plugin of listChannelPlugins()) await params.stopChannel(plugin.id);
			await disposeRegisteredAgentHarnesses();
			await Promise.all([disposeRuntimeWithShutdownGrace({
				label: "bundle-mcp",
				dispose: params.disposeSessionMcpRuntimes ?? disposeAllSessionMcpRuntimes,
				graceMs: MCP_RUNTIME_CLOSE_GRACE_MS
			}), disposeRuntimeWithShutdownGrace({
				label: "bundle-lsp",
				dispose: params.disposeBundleLspRuntimes ?? disposeAllBundleLspRuntimesOnDemand,
				graceMs: LSP_RUNTIME_CLOSE_GRACE_MS
			})]);
			if (params.pluginServices) await params.pluginServices.stop().catch(() => {});
			await stopGmailWatcherOnDemand();
			params.cron.stop();
			params.heartbeatRunner.stop();
			try {
				params.stopTaskRegistryMaintenance?.();
			} catch {}
			try {
				params.updateCheckStop?.();
			} catch {}
			for (const timer of params.nodePresenceTimers.values()) clearInterval(timer);
			params.nodePresenceTimers.clear();
			params.broadcast("shutdown", {
				reason,
				restartExpectedMs
			});
			clearInterval(params.tickInterval);
			clearInterval(params.healthInterval);
			clearInterval(params.dedupeCleanup);
			if (params.mediaCleanup) clearInterval(params.mediaCleanup);
			if (params.agentUnsub) try {
				params.agentUnsub();
			} catch {}
			if (params.heartbeatUnsub) try {
				params.heartbeatUnsub();
			} catch {}
			if (params.transcriptUnsub) try {
				params.transcriptUnsub();
			} catch {}
			if (params.lifecycleUnsub) try {
				params.lifecycleUnsub();
			} catch {}
			params.chatRunState.clear();
			for (const c of params.clients) try {
				c.socket.close(1012, "service restart");
			} catch {}
			params.clients.clear();
			await params.configReloader.stop().catch(() => {});
			const wsClients = params.wss.clients ?? /* @__PURE__ */ new Set();
			const closePromise = new Promise((resolve) => params.wss.close(() => resolve()));
			const websocketGraceTimeout = createTimeoutRace(WEBSOCKET_CLOSE_GRACE_MS, () => false);
			const closedWithinGrace = await Promise.race([closePromise.then(() => true), websocketGraceTimeout.promise]);
			websocketGraceTimeout.clear();
			if (!closedWithinGrace) {
				shutdownLog.warn(`websocket server close exceeded ${WEBSOCKET_CLOSE_GRACE_MS}ms; forcing shutdown continuation with ${wsClients.size} tracked client(s)`);
				for (const client of wsClients) try {
					client.terminate();
				} catch {}
				const websocketForceTimeout = createTimeoutRace(WEBSOCKET_CLOSE_FORCE_CONTINUE_MS, () => {
					shutdownLog.warn(`websocket server close still pending after ${WEBSOCKET_CLOSE_FORCE_CONTINUE_MS}ms force window; continuing shutdown`);
				});
				await Promise.race([closePromise, websocketForceTimeout.promise]);
				websocketForceTimeout.clear();
			}
			const servers = params.httpServers && params.httpServers.length > 0 ? params.httpServers : [params.httpServer];
			for (const server of servers) {
				const httpServer = server;
				if (typeof httpServer.closeIdleConnections === "function") httpServer.closeIdleConnections();
				const closePromise = new Promise((resolve, reject) => httpServer.close((err) => {
					if (!err || isServerNotRunningError(err)) {
						resolve();
						return;
					}
					reject(err);
				}));
				const httpGraceTimeout = createTimeoutRace(HTTP_CLOSE_GRACE_MS, () => false);
				const closedWithinGrace = await Promise.race([closePromise.then(() => true), httpGraceTimeout.promise]);
				httpGraceTimeout.clear();
				if (!closedWithinGrace) {
					shutdownLog.warn(`http server close exceeded ${HTTP_CLOSE_GRACE_MS}ms; forcing connection shutdown and waiting for close`);
					httpServer.closeAllConnections?.();
					const httpForceTimeout = createTimeoutRace(HTTP_CLOSE_FORCE_WAIT_MS, () => false);
					const closedAfterForce = await Promise.race([closePromise.then(() => true), httpForceTimeout.promise]);
					httpForceTimeout.clear();
					if (!closedAfterForce) throw new Error(`http server close still pending after forced connection shutdown (${HTTP_CLOSE_FORCE_WAIT_MS}ms)`);
				}
			}
		} finally {
			try {
				params.releasePluginRouteRegistry?.();
			} catch {}
		}
	};
}
//#endregion
export { createGatewayCloseHandler, runGatewayClosePrelude };
