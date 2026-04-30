import { r as describeImagesWithModel, t as describeImageWithModel } from "./image-runtime-Dpz0bZ9D.js";
import "./media-understanding-BhLOuzTU.js";
//#region extensions/openrouter/media-understanding-provider.ts
const openrouterMediaUnderstandingProvider = {
	id: "openrouter",
	capabilities: ["image"],
	defaultModels: { image: "auto" },
	describeImage: describeImageWithModel,
	describeImages: describeImagesWithModel
};
//#endregion
export { openrouterMediaUnderstandingProvider as t };
