import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
const { waitForVite } = createRequire(import.meta.url)('../scripts/browser-startup.cjs');
const server = () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.kill = vi.fn();
  return child;
};
afterEach(() => vi.useRealTimers());
describe('bounded browser server startup', () => {
  it('recognizes CI-coloured Local output and clears its timer', async () => {
    vi.useFakeTimers();
    const child = server();
    const ready = waitForVite(child, 50);
    child.stdout.emit('data', Buffer.from('\u001b[1mLocal\u001b[22m: http://localhost:5189'));
    await ready;
    await vi.advanceTimersByTimeAsync(100);
    expect(child.kill).not.toHaveBeenCalled();
  });
  it('kills a server that never announces readiness', async () => {
    vi.useFakeTimers();
    const child = server();
    const result = expect(waitForVite(child, 50)).rejects.toThrow('startup timed out');
    await vi.advanceTimersByTimeAsync(51);
    await result;
    expect(child.kill).toHaveBeenCalledOnce();
  });
  it('rejects and cleans up an early process exit', async () => {
    const child = server();
    const result = expect(waitForVite(child)).rejects.toThrow('Vite exited 1');
    child.emit('exit', 1);
    await result;
    expect(child.kill).toHaveBeenCalledOnce();
  });
  it('rejects and cleans up a spawn error', async () => {
    const child = server();
    const result = expect(waitForVite(child)).rejects.toThrow('spawn failed');
    child.emit('error', new Error('spawn failed'));
    await result;
    expect(child.kill).toHaveBeenCalledOnce();
  });
});
