import { describe, expect, it } from 'vitest';
import { AmplifyWorkspaceRuntime, RUN_LEDGER_KEY, WORKSPACE_KEY, type WorkspaceSnapshot } from './amplifyWorkspace';

class MemoryStorage {
  values = new Map<string, string>();
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) { this.values.set(key, value); }
}

const snapshot: WorkspaceSnapshot = {
  schemaVersion: 1,
  savedAt: '2026-10-11T00:00:00.000Z',
  stocks: [{ id: 'S-1', label: 'Measured', width: 600, height: 400, thickness: 18, grain: 'none', defects: [] }],
  product: 'organizer', width: 420, depth: 220, height: 180, kerf: 3, quantity: 1,
  price: 1299, makerCost: 620, shipping: 120, channelFee: 8, leadDays: 5,
};

describe('Amplify workspace runtime', () => {
  it('round-trips a measured workspace through the injected key-value store', async () => {
    const storage = new MemoryStorage();
    const runtime = new AmplifyWorkspaceRuntime(storage);
    await runtime.saveWorkspace(snapshot);
    expect(storage.values.has(WORKSPACE_KEY)).toBe(true);
    expect(await runtime.loadWorkspace()).toEqual(snapshot);
  });

  it('records a reproducible, bounded solve result with an input fingerprint', async () => {
    const storage = new MemoryStorage();
    const runtime = new AmplifyWorkspaceRuntime(storage);
    const pending = runtime.beginSolve({ stocks: snapshot.stocks, kerf: 3 });
    runtime.markRunning(pending.id);
    const run = await runtime.completeSolve({
      ...pending, status: 'succeeded', partCount: 5, placementCount: 5,
      utilization: 0.74, elapsedMs: 1.2, validationStatus: 'PASSED',
    });
    expect(run.inputFingerprint).toMatch(/^[a-f0-9]{8}$/);
    expect((await runtime.getRuns())[0]).toEqual(run);
    expect(storage.values.has(RUN_LEDGER_KEY)).toBe(true);
  });
});
