import type { ConnectionPolicy, ConnectionRoute, RouteCapabilities } from './connection-policy.ts';
import type { TunnelClient } from './client.ts';
export type ConnectionPhase = 'direct-connecting' | 'direct-open' | 'tunnel-connecting' | 'tunnel-open' | 'offline';
export interface ConnectionStatus {
    phase: ConnectionPhase;
    route: ConnectionRoute | null;
    error?: string;
}
export interface ConnectionCoordinatorOptions {
    policy: ConnectionPolicy;
    capabilities: RouteCapabilities;
    connectDirect: (signal?: AbortSignal) => Promise<TunnelClient>;
    connectTunnel: (signal?: AbortSignal) => Promise<TunnelClient>;
    onState?: (status: ConnectionStatus) => void;
    /**
     * Automatic only: Direct may win only if it finishes within this window.
     * After the window, late Direct is discarded and Tunnel remains the route.
     */
    directGraceMs?: number;
}
/** Same-LAN Direct may steal Automatic only inside this window. */
export declare const DEFAULT_DIRECT_GRACE_MS = 2000;
/** Select one visible route at a time while keeping transport creation injectable. */
export declare class ConnectionCoordinator {
    private client;
    private route;
    private readonly options;
    constructor(options: ConnectionCoordinatorOptions);
    get activeRoute(): ConnectionRoute | null;
    get activeClient(): TunnelClient | null;
    connect(): Promise<TunnelClient>;
    private startRoute;
    private connectOne;
    /**
     * Race Tunnel (started first) with Direct. Direct may win only inside the
     * grace window; a terminal Host verdict aborts every route.
     */
    private connectAutomatic;
    private accept;
    probe(timeoutMs?: number): Promise<void>;
    close(): void;
    private emit;
}
//# sourceMappingURL=connection-manager.d.ts.map