import { u as resolveStorePath } from "./paths-Bg_QeV2r.js";
import { a as updateLastRoute, n as readSessionUpdatedAt, r as recordSessionMetaFromInbound } from "./store-BNAn-6FU.js";
import "./sessions-D8ANGXQF.js";
import { t as finalizeInboundContext } from "./inbound-context-BPrXNWmC.js";
import { n as fetchRemoteMedia } from "./fetch-BgxNacCx.js";
import { i as resolveHumanDelayConfig, r as resolveEffectiveMessagesConfig } from "./identity-CIX88Or7.js";
import { l as saveMediaBuffer } from "./store-DpHDDFdI.js";
import { n as resolveChannelGroupRequireMention, t as resolveChannelGroupPolicy } from "./group-policy-DCNBcCMd.js";
import { a as chunkText, c as resolveTextChunkLimit, i as chunkMarkdownTextWithMode, o as chunkTextWithMode, r as chunkMarkdownText, s as resolveChunkMode, t as chunkByNewline } from "./chunk-B3rcqzHX.js";
import { t as loadChannelOutboundAdapter } from "./load-BPqQCYvm.js";
import { i as resolveAgentRoute, t as buildAgentSessionKey } from "./resolve-route-B-BcZvIS.js";
import { t as convertMarkdownTables } from "./tables-bRgAQOWR.js";
import { i as shouldComputeCommandAuthorized, r as isControlCommandMessage, t as hasControlCommand } from "./command-detection-RxNwxlBu.js";
import { p as shouldHandleTextCommands } from "./commands-registry-BQ3mD9-3.js";
import { a as createReplyDispatcherWithTyping, o as dispatchReplyFromConfig, s as withReplyDispatcher } from "./dispatch-Bd9Vyd-o.js";
import { i as matchesMentionWithExplicit, n as buildMentionRegexes, r as matchesMentionPatterns } from "./mentions-DEuCG3JW.js";
import { a as resolveEnvelopeFormatOptions, r as formatInboundEnvelope, t as formatAgentEnvelope } from "./envelope-grRVAhSU.js";
import { n as resolveInboundDebounceMs, t as createInboundDebouncer } from "./inbound-debounce-PckXfVZ1.js";
import { t as dispatchReplyWithBufferedBlockDispatcher } from "./provider-dispatcher-MptAqgw0.js";
import { i as shouldAckReaction, n as removeAckReactionAfterReply, r as removeAckReactionHandleAfterReply, t as createAckReactionHandle } from "./ack-reactions-CM-5N-_v.js";
import { t as resolveCommandAuthorizedFromAuthorizers } from "./command-gating-Be48Mr-Y.js";
import { n as resolveInboundMentionDecision, t as implicitMentionKindWhen } from "./mention-gating-D1pxmIRH.js";
import { n as setChannelConversationBindingMaxAgeBySessionKey, t as setChannelConversationBindingIdleTimeoutBySessionKey } from "./conversation-bindings-xgveJx6w.js";
import { t as recordInboundSession } from "./session-D5rAz7hw.js";
import { t as resolveMarkdownTableMode } from "./markdown-tables-AnSyLK0z.js";
import { n as recordChannelActivity, t as getChannelActivity } from "./channel-activity-CvCKamJJ.js";
import { t as buildPairingReply } from "./pairing-messages-7V5csdkg.js";
import { a as readChannelAllowFromStore, d as upsertChannelPairingRequest } from "./pairing-store-CkcMrgB2.js";
import { t as createChannelRuntimeContextRegistry } from "./channel-runtime-contexts-DiJToydX.js";
//#region src/plugins/runtime/runtime-channel.ts
function createRuntimeChannel() {
	return {
		text: {
			chunkByNewline,
			chunkMarkdownText,
			chunkMarkdownTextWithMode,
			chunkText,
			chunkTextWithMode,
			resolveChunkMode,
			resolveTextChunkLimit,
			hasControlCommand,
			resolveMarkdownTableMode,
			convertMarkdownTables
		},
		reply: {
			dispatchReplyWithBufferedBlockDispatcher,
			createReplyDispatcherWithTyping,
			resolveEffectiveMessagesConfig,
			resolveHumanDelayConfig,
			dispatchReplyFromConfig,
			withReplyDispatcher,
			finalizeInboundContext,
			formatAgentEnvelope,
			/** @deprecated Prefer `BodyForAgent` + structured user-context blocks (do not build plaintext envelopes for prompts). */
			formatInboundEnvelope,
			resolveEnvelopeFormatOptions
		},
		routing: {
			buildAgentSessionKey,
			resolveAgentRoute
		},
		pairing: {
			buildPairingReply,
			readAllowFromStore: ({ channel, accountId, env }) => readChannelAllowFromStore(channel, env, accountId),
			upsertPairingRequest: ({ channel, id, accountId, meta, env, pairingAdapter }) => upsertChannelPairingRequest({
				channel,
				id,
				accountId,
				meta,
				env,
				pairingAdapter
			})
		},
		media: {
			fetchRemoteMedia,
			saveMediaBuffer
		},
		activity: {
			record: recordChannelActivity,
			get: getChannelActivity
		},
		session: {
			resolveStorePath,
			readSessionUpdatedAt,
			recordSessionMetaFromInbound,
			recordInboundSession,
			updateLastRoute
		},
		mentions: {
			buildMentionRegexes,
			matchesMentionPatterns,
			matchesMentionWithExplicit,
			implicitMentionKindWhen,
			resolveInboundMentionDecision
		},
		reactions: {
			createAckReactionHandle,
			shouldAckReaction,
			removeAckReactionAfterReply,
			removeAckReactionHandleAfterReply
		},
		groups: {
			resolveGroupPolicy: resolveChannelGroupPolicy,
			resolveRequireMention: resolveChannelGroupRequireMention
		},
		debounce: {
			createInboundDebouncer,
			resolveInboundDebounceMs
		},
		commands: {
			resolveCommandAuthorizedFromAuthorizers,
			isControlCommandMessage,
			shouldComputeCommandAuthorized,
			shouldHandleTextCommands
		},
		outbound: { loadAdapter: loadChannelOutboundAdapter },
		threadBindings: {
			setIdleTimeoutBySessionKey: ({ channelId, targetSessionKey, accountId, idleTimeoutMs }) => setChannelConversationBindingIdleTimeoutBySessionKey({
				channelId,
				targetSessionKey,
				accountId,
				idleTimeoutMs
			}),
			setMaxAgeBySessionKey: ({ channelId, targetSessionKey, accountId, maxAgeMs }) => setChannelConversationBindingMaxAgeBySessionKey({
				channelId,
				targetSessionKey,
				accountId,
				maxAgeMs
			})
		},
		runtimeContexts: createChannelRuntimeContextRegistry()
	};
}
//#endregion
export { createRuntimeChannel as t };
