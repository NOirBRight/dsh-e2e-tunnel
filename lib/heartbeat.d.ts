import { TunnelError } from './errors.ts';
export interface HeartbeatTarget {
    probe(timeoutMs?: number): Promise<void>;
}
export interface HeartbeatScheduler {
    setTimeout(callback: () => void | Promise<void>, delayMs: number): unknown;
    clearTimeout(handle: unknown): void;
}
export interface HeartbeatOptions {
    target: HeartbeatTarget;
    onStale: (error: TunnelError) => void;
    scheduler?: HeartbeatScheduler;
    intervalMs?: number;
    pongTimeoutMs?: number;
    maxMisses?: number;
}
/** Foreground liveness loop shared by WebRTC and Tunnel Fallback sessions. */
export declare class HeartbeatController {
    private readonly options;
    private readonly scheduler;
    private timer;
    private running;
    private missed;
    private probePromise;
    constructor(options: HeartbeatOptions);
    start(): void;
    stop(): void;
    /** Immediate probe used on foreground resume and network change. */
    probeNow(): Promise<void>;
    private schedule;
}
//# sourceMappingURL=heartbeat.d.ts.map