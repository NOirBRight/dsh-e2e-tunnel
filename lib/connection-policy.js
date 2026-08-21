import { TunnelError } from "./errors.js";
/** Return the only permitted route order for one connection attempt. */
export function connectionAttempts(policy, capabilities) {
    const attempts = [];
    if (policy !== 'direct-only' && capabilities.tunnel)
        attempts.push('tunnel');
    if (policy !== 'tunnel-only' && capabilities.direct)
        attempts.push('direct');
    if (attempts.length === 0) {
        throw new TunnelError('no-route', `connection policy ${policy} has no available route`);
    }
    return attempts;
}
//# sourceMappingURL=connection-policy.js.map