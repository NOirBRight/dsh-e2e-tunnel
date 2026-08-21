export type ConnectionPolicy = 'automatic' | 'direct-only' | 'tunnel-only';
export type ConnectionRoute = 'direct' | 'tunnel';
export interface RouteCapabilities {
    direct: boolean;
    tunnel: boolean;
}
/** Return the only permitted route order for one connection attempt. */
export declare function connectionAttempts(policy: ConnectionPolicy, capabilities: RouteCapabilities): ConnectionRoute[];
//# sourceMappingURL=connection-policy.d.ts.map