import { TunnelError } from "./errors.js";
const defaultScheduler = {
    setTimeout(callback, delayMs) { return globalThis.setTimeout(callback, delayMs); },
    clearTimeout(handle) { globalThis.clearTimeout(handle); },
};
/** Foreground liveness loop shared by WebRTC and Tunnel Fallback sessions. */
export class HeartbeatController {
    options;
    scheduler;
    timer = null;
    running = false;
    missed = 0;
    probePromise = null;
    constructor(options) {
        this.options = { intervalMs: 20_000, pongTimeoutMs: 15_000, maxMisses: 3, ...options };
        this.scheduler = options.scheduler ?? defaultScheduler;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.missed = 0;
        this.schedule();
    }
    stop() {
        this.running = false;
        if (this.timer !== null)
            this.scheduler.clearTimeout(this.timer);
        this.timer = null;
    }
    /** Immediate probe used on foreground resume and network change. */
    probeNow() {
        if (this.probePromise !== null)
            return this.probePromise;
        const run = this.options.target.probe(this.options.pongTimeoutMs).then(() => { this.missed = 0; }, (error) => {
            this.missed += 1;
            if (this.missed >= this.options.maxMisses) {
                const stale = error instanceof TunnelError ? error : new TunnelError('stale', error instanceof Error ? error.message : String(error));
                this.stop();
                this.options.onStale(stale);
            }
        }).finally(() => { this.probePromise = null; });
        this.probePromise = run;
        return run;
    }
    schedule() {
        if (!this.running)
            return;
        this.timer = this.scheduler.setTimeout(async () => {
            this.timer = null;
            await this.probeNow();
            this.schedule();
        }, this.options.intervalMs);
    }
}
//# sourceMappingURL=heartbeat.js.map