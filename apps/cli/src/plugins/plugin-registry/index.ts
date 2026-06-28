/**
 * Derivo Plugin SDK — Registry
 *
 * The in-memory catalog of known plugins plus persisted enabled/disabled
 * state (~/.derivo/plugin-state.json). Pure bookkeeping: it never loads code
 * or runs plugins — that is the loader's and runtime's job.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { PluginRecord } from '../plugin-types/index.js';

const STATE_FILE = path.join(os.homedir(), '.derivo', 'plugin-state.json');

interface PersistedState {
  disabled: string[];
}

export class PluginRegistry {
  private readonly records = new Map<string, PluginRecord>();
  private disabled: Set<string>;

  constructor(stateFile: string = STATE_FILE) {
    this.stateFile = stateFile;
    this.disabled = new Set(this.loadState().disabled);
  }

  private readonly stateFile: string;

  register(record: PluginRecord): void {
    // Honour persisted disabled state on registration.
    if (this.disabled.has(record.manifest.id)) {
      record.enabled = false;
      if (record.state !== 'failed') record.state = 'disabled';
    }
    this.records.set(record.manifest.id, record);
  }

  unregister(id: string): boolean {
    return this.records.delete(id);
  }

  has(id: string): boolean {
    return this.records.has(id);
  }

  get(id: string): PluginRecord | undefined {
    return this.records.get(id);
  }

  list(): PluginRecord[] {
    return [...this.records.values()].sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
  }

  enabled(): PluginRecord[] {
    return this.list().filter((r) => r.enabled && r.state !== 'failed');
  }

  enable(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;
    record.enabled = true;
    if (record.state === 'disabled') record.state = 'discovered';
    this.disabled.delete(id);
    this.persist();
    return true;
  }

  disable(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;
    record.enabled = false;
    record.state = 'disabled';
    record.instance = undefined;
    this.disabled.add(id);
    this.persist();
    return true;
  }

  isDisabled(id: string): boolean {
    return this.disabled.has(id);
  }

  /** Remove a record so the loader can rediscover it (used by reload). */
  reload(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;
    this.records.delete(id);
    return true;
  }

  clear(): void {
    this.records.clear();
  }

  private loadState(): PersistedState {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      return { disabled: Array.isArray(parsed.disabled) ? parsed.disabled : [] };
    } catch {
      return { disabled: [] };
    }
  }

  private persist(): void {
    try {
      fs.mkdirSync(path.dirname(this.stateFile), { recursive: true });
      fs.writeFileSync(
        this.stateFile,
        JSON.stringify({ disabled: [...this.disabled] }, null, 2),
        'utf8',
      );
    } catch {
      // State persistence is best-effort.
    }
  }
}
