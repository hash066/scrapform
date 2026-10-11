import { Hub, defaultStorage } from 'aws-amplify/utils';
import type { ProductKey, Stock } from './types';

export const WORKSPACE_KEY = 'scrapform.workspace.v1';
export const RUN_LEDGER_KEY = 'scrapform.solve-runs.v1';
export const WORKSPACE_CHANNEL = 'scrapform-workspace';

export type WorkspaceSnapshot = {
  schemaVersion: 1;
  savedAt: string;
  stocks: Stock[];
  product: ProductKey;
  width: number;
  depth: number;
  height: number;
  kerf: number;
  quantity: number;
  price: number;
  makerCost: number;
  shipping: number;
  channelFee: number;
  leadDays: number;
};

export type SolveRun = {
  id: string;
  inputFingerprint: string;
  createdAt: string;
  completedAt: string;
  status: 'succeeded' | 'infeasible';
  partCount: number;
  placementCount: number;
  utilization: number;
  elapsedMs: number;
  validationStatus: 'PASSED' | 'FAILED';
  modelVersion: 'scrapform-browser-planner-v1';
};

type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

function fingerprint(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export class AmplifyWorkspaceRuntime {
  constructor(private readonly storage: KeyValueStorage = defaultStorage) {}

  async loadWorkspace(): Promise<WorkspaceSnapshot | null> {
    const raw = await this.storage.getItem(WORKSPACE_KEY);
    if (!raw) return null;
    try {
      const snapshot = JSON.parse(raw) as WorkspaceSnapshot;
      return snapshot.schemaVersion === 1 && Array.isArray(snapshot.stocks) ? snapshot : null;
    } catch {
      return null;
    }
  }

  async saveWorkspace(snapshot: WorkspaceSnapshot) {
    await this.storage.setItem(WORKSPACE_KEY, JSON.stringify(snapshot));
    Hub.dispatch(WORKSPACE_CHANNEL, { event: 'workspaceSaved', data: { savedAt: snapshot.savedAt } });
  }

  beginSolve(input: unknown) {
    const inputFingerprint = fingerprint(input);
    const id = globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${inputFingerprint}`;
    Hub.dispatch(WORKSPACE_CHANNEL, { event: 'solveQueued', data: { id, inputFingerprint } });
    return { id, inputFingerprint, createdAt: new Date().toISOString() };
  }

  markRunning(id: string) {
    Hub.dispatch(WORKSPACE_CHANNEL, { event: 'solveRunning', data: { id } });
  }

  async completeSolve(run: Omit<SolveRun, 'completedAt' | 'modelVersion'>) {
    const completed: SolveRun = {
      ...run,
      completedAt: new Date().toISOString(),
      modelVersion: 'scrapform-browser-planner-v1',
    };
    const ledger = await this.getRuns();
    await this.storage.setItem(RUN_LEDGER_KEY, JSON.stringify([completed, ...ledger].slice(0, 20)));
    Hub.dispatch(WORKSPACE_CHANNEL, { event: 'solveCompleted', data: completed });
    return completed;
  }

  async getRuns(): Promise<SolveRun[]> {
    const raw = await this.storage.getItem(RUN_LEDGER_KEY);
    if (!raw) return [];
    try {
      const runs = JSON.parse(raw) as SolveRun[];
      return Array.isArray(runs) ? runs : [];
    } catch {
      return [];
    }
  }

  subscribe(listener: (event: string, data: unknown) => void) {
    return Hub.listen(WORKSPACE_CHANNEL, ({ payload }) => listener(payload.event, payload.data));
  }
}

export const workspaceRuntime = new AmplifyWorkspaceRuntime();

