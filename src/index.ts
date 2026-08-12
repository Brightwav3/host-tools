/**
 * Host Tools — public entry point.
 */

export const PACKAGE_NAME = "host-tools";
export const CATALOGUE_VERSION = "0.1.0";

export type {
  AllowlistHttpBrokerConfig,
  CaptureHandle,
  HttpBroker,
  HttpResponse,
  ScreenCapture,
  SystemProbe,
  SystemSnapshot,
  VolumeControl,
} from "./services.js";
export { AllowlistHttpBroker, HttpRejection } from "./services.js";

export type { CatalogueConfig, InstallReport } from "./catalogue.js";
export { installCatalogue } from "./catalogue.js";

export { systemStatusDeclaration, systemStatusHandler } from "./tools/system-status.js";
export type { WeatherConfig, WebSearchConfig } from "./tools/web-search.js";
export { weatherDeclaration, weatherHandler, webSearchDeclaration, webSearchHandler } from "./tools/web-search.js";
export type { OpenUrlConfig } from "./tools/host-control.js";
export { openUrlDeclaration, openUrlHandler, setVolumeDeclaration, setVolumeHandler } from "./tools/host-control.js";
export { screenCaptureDeclaration, screenCaptureHandler } from "./tools/screen-capture.js";

export type { Clock, UptimeSource } from "./tools/simple.js";
export { calculateDeclaration, calculateHandler, getTimeDeclaration, getTimeHandler, systemClock, uptimeDeclaration, uptimeHandler } from "./tools/simple.js";

export type { NodeSystemProbeOptions } from "./hosts/node.js";
export { nodeSystemProbe, nodeUptimeSource } from "./hosts/node.js";
