import { a as buildProviderToolCompatFamilyHooks } from "../../provider-tools-Sdt6EjDe.js";
import { t as definePluginEntry } from "../../plugin-entry-DyZc6JGI.js";
import { r as resolvePluginConfigObject } from "../../plugin-config-runtime-DtU3nrZS.js";
import { t as buildOpenAICodexCliBackend } from "../../cli-backend-Sq_HMvO0.js";
import { t as buildOpenAIImageGenerationProvider } from "../../image-generation-provider-ClzOuym8.js";
import { n as openaiCodexMediaUnderstandingProvider, r as openaiMediaUnderstandingProvider } from "../../media-understanding-provider-BXKq33Md2.js";
import { t as openAiMemoryEmbeddingProviderAdapter } from "../../memory-embedding-adapter-D_Lu0dDH.js";
import { t as buildOpenAICodexProviderPlugin } from "../../openai-codex-provider-CDTkppsY.js";
import { t as buildOpenAIProvider } from "../../openai-provider-UtjzhZ-b.js";
import { i as resolveOpenAISystemPromptContribution, r as resolveOpenAIPromptOverlayMode } from "../../prompt-overlay-DZfhFQD9.js";
import { t as buildOpenAIRealtimeTranscriptionProvider } from "../../realtime-transcription-provider-DLnHznS0.js";
import { t as buildOpenAIRealtimeVoiceProvider } from "../../realtime-voice-provider-LLpK87Lh.js";
import { t as buildOpenAISpeechProvider } from "../../speech-provider-DHb0e1h5.js";
import { t as buildOpenAIVideoGenerationProvider } from "../../video-generation-provider-ZAOfCcu4.js";
//#region extensions/openai/index.ts
var openai_default = definePluginEntry({
	id: "openai",
	name: "OpenAI Provider",
	description: "Bundled OpenAI provider plugins",
	register(api) {
		const openAIToolCompatHooks = buildProviderToolCompatFamilyHooks("openai");
		const buildProviderWithPromptContribution = (provider) => ({
			...provider,
			...openAIToolCompatHooks,
			resolveSystemPromptContribution: (ctx) => {
				const pluginConfig = resolvePluginConfigObject(ctx.config, "openai") ?? (ctx.config ? void 0 : api.pluginConfig);
				return resolveOpenAISystemPromptContribution({
					config: ctx.config,
					legacyPluginConfig: pluginConfig,
					mode: resolveOpenAIPromptOverlayMode(pluginConfig),
					modelProviderId: provider.id,
					modelId: ctx.modelId
				});
			}
		});
		api.registerCliBackend(buildOpenAICodexCliBackend());
		api.registerProvider(buildProviderWithPromptContribution(buildOpenAIProvider()));
		api.registerProvider(buildProviderWithPromptContribution(buildOpenAICodexProviderPlugin()));
		api.registerMemoryEmbeddingProvider(openAiMemoryEmbeddingProviderAdapter);
		api.registerImageGenerationProvider(buildOpenAIImageGenerationProvider());
		api.registerRealtimeTranscriptionProvider(buildOpenAIRealtimeTranscriptionProvider());
		api.registerRealtimeVoiceProvider(buildOpenAIRealtimeVoiceProvider());
		api.registerSpeechProvider(buildOpenAISpeechProvider());
		api.registerMediaUnderstandingProvider(openaiMediaUnderstandingProvider);
		api.registerMediaUnderstandingProvider(openaiCodexMediaUnderstandingProvider);
		api.registerVideoGenerationProvider(buildOpenAIVideoGenerationProvider());
	}
});
//#endregion
export { openai_default as default };
