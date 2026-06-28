/**
 * Derivo CLI — Telemetry framework (OFF by default)
 *
 * This ships the *framework* only. Telemetry is disabled unless the user
 * explicitly opts in (`derivo telemetry enable`). Even when enabled, events are
 * written to a local queue file — no data leaves the machine and no network
 * endpoint is bundled. A future phase can add a transport.
 */
import fs from 'fs';
import { getGlobalConfig, saveGlobalConfig } from './config.js';
import { derivoPaths } from './paths.js';

export interface TelemetryEvent {
  event: string;
  timestamp: string;
  properties?: Record<string, unknown>;
}

/** Telemetry is opt-in: disabled unless explicitly enabled in config. */
export function isTelemetryEnabled(): boolean {
  return getGlobalConfig().telemetryEnabled === true;
}

export function setTelemetryEnabled(enabled: boolean): void {
  const config = getGlobalConfig();
  config.telemetryEnabled = enabled;
  saveGlobalConfig(config);
}

/**
 * Record an event. No-op unless telemetry is enabled. When enabled, the event
 * is appended to a local queue file only (never transmitted). Always safe —
 * failures are swallowed so telemetry can never affect command behavior.
 */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (!isTelemetryEnabled()) return;
  try {
    const entry: TelemetryEvent = {
      event,
      timestamp: new Date().toISOString(),
      properties,
    };
    fs.appendFileSync(derivoPaths.telemetryQueue(), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // Telemetry must never throw.
  }
}

export function getTelemetryStatus(): { enabled: boolean; queuePath: string } {
  return { enabled: isTelemetryEnabled(), queuePath: derivoPaths.telemetryQueue() };
}
