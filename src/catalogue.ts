/**
 * Catalogue installation.
 *
 * A host assembles the services it can actually provide and installs the
 * capabilities those services support. Nothing is registered by default: a
 * catalogue that installs itself would grant capability by being imported,
 * which is the same failure as a policy that permits by omission.
 */

import type { ToolError, ToolRegistry } from "tool-system";

import type { HttpBroker, ScreenCapture, SystemProbe, VolumeControl } from "./services.js";
import { openUrlDeclaration, openUrlHandler, setVolumeDeclaration, setVolumeHandler, type OpenUrlConfig } from "./tools/host-control.js";
import { screenCaptureDeclaration, screenCaptureHandler } from "./tools/screen-capture.js";
import { calculateDeclaration, calculateHandler, getTimeDeclaration, getTimeHandler, systemClock, uptimeDeclaration, uptimeHandler, type Clock, type UptimeSource } from "./tools/simple.js";
import { systemStatusDeclaration, systemStatusHandler } from "./tools/system-status.js";
import { weatherDeclaration, weatherHandler, webSearchDeclaration, webSearchHandler, type WeatherConfig, type WebSearchConfig } from "./tools/web-search.js";

export interface CatalogueConfig {
  /** Cheap capabilities install by default; pass false to leave them out. */
  readonly simple?: boolean;
  readonly clock?: Clock;
  readonly uptime?: UptimeSource;
  readonly system?: SystemProbe;
  readonly volume?: VolumeControl;
  readonly screen?: ScreenCapture;
  readonly http?: HttpBroker;
  readonly search?: WebSearchConfig;
  readonly weather?: WeatherConfig & { readonly cities: readonly string[] };
  readonly openUrl?: OpenUrlConfig;
}

export interface InstallReport {
  readonly installed: readonly string[];
  readonly failed: readonly ToolError[];
}

/**
 * Installs every capability whose services are present.
 *
 * Failures are collected rather than thrown so a host with a partially
 * available environment still gets the capabilities it can support, and can
 * report precisely which ones it could not.
 */
export function installCatalogue(registry: ToolRegistry, config: CatalogueConfig): InstallReport {
  const installed: string[] = [];
  const failed: ToolError[] = [];

  const add = (name: string, register: () => ToolError | null): void => {
    const error = register();
    if (error === null) {
      installed.push(name);
    } else {
      failed.push(error);
    }
  };

  // These need nothing configured, so they are present unless refused. A
  // catalogue whose useful entries all require setup is one nobody turns on.
  if (config.simple !== false) {
    add("get_time", () => registry.register(getTimeDeclaration(), getTimeHandler(config.clock ?? systemClock)));
    add("calculate", () => registry.register(calculateDeclaration(), calculateHandler()));
    if (config.uptime) {
      const source = config.uptime;
      add("uptime", () => registry.register(uptimeDeclaration(), uptimeHandler(source)));
    }
  }

  if (config.system) {
    const probe = config.system;
    add("system_status", () => registry.register(systemStatusDeclaration(), systemStatusHandler(probe)));
  }

  if (config.http && config.search) {
    const { http, search } = config;
    add("web_search", () => registry.register(webSearchDeclaration(), webSearchHandler(http, search)));
  }

  if (config.http && config.weather) {
    const { http, weather } = config;
    add("weather_report", () =>
      registry.register(weatherDeclaration(weather.cities), weatherHandler(http, weather)),
    );
  }

  if (config.openUrl) {
    const openUrl = config.openUrl;
    add("open_url", () => registry.register(openUrlDeclaration(openUrl), openUrlHandler(openUrl)));
  }

  if (config.volume) {
    const volume = config.volume;
    add("set_volume", () => registry.register(setVolumeDeclaration(), setVolumeHandler(volume)));
  }

  if (config.screen) {
    const screen = config.screen;
    add("screen_capture", () => registry.register(screenCaptureDeclaration(), screenCaptureHandler(screen)));
  }

  return { installed, failed };
}
