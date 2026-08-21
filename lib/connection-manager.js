import { connectionAttempts } from "./connection-policy.js";
import { TunnelError } from "./errors.js";
/** Same-LAN Direct may steal Automatic only inside this window. */
export const DEFAULT_DIRECT_GRACE_MS = 2_000;
const TERMINAL_HOST_ERRORS = new Set([
    'bad-offer', 'bad-code', 'expired', 'bad-token', 'bad-key', 'unauthorized', 'identity-mismatch', 'incompatible', 'limit',
]);
/** Authentication, identity, and compatibility failures must not be hidden by route fallback. */
function mayFallbackAfter(error) {
    return !(error instanceof TunnelError) || !TERMINAL_HOST_ERRORS.has(error.code);
}
/** Select one visible route at a time while keeping transport creation injectable. */
export class ConnectionCoordinator {
    client = null;
    route = null;
    options;
    constructor(options) {
        this.options = options;
    }
    get activeRoute() {
        return this.route;
    }
    get activeClient() {
        return this.client;
    }
    async connect() {
        this.close();
        const attempts = connectionAttempts(this.options.policy, this.options.capabilities);
        if (attempts.length === 1)
            return this.connectOne(attempts[0]);
        return this.connectAutomatic(attempts);
    }
    startRoute(route) {
        return route === 'direct' ? this.options.connectDirect() : this.options.connectTunnel();
    }
    async connectOne(route) {
        this.emit(route === 'direct' ? 'direct-connecting' : 'tunnel-connecting', route);
        try {
            const client = await this.startRoute(route);
            return this.accept(route, client);
        }
        catch (error) {
            const failure = error instanceof Error ? error : new TunnelError('offline', String(error));
            this.emit('offline', null, failure.message);
            throw failure;
        }
    }
    /**
     * Race Tunnel (started first) with Direct. Direct may win only inside the
     * grace window; a terminal Host verdict aborts every route.
     */
    async connectAutomatic(attempts) {
        for (const route of attempts) {
            this.emit(route === 'direct' ? 'direct-connecting' : 'tunnel-connecting', route);
        }
        const graceMs = this.options.directGraceMs ?? DEFAULT_DIRECT_GRACE_MS;
        return new Promise((resolve, reject) => {
            let settled = false;
            let pending = attempts.length;
            let graceOpen = true;
            let lastError = null;
            const discarded = [];
            const graceTimer = setTimeout(() => { graceOpen = false; }, graceMs);
            const discard = (client) => {
                discarded.push(client);
                client.discard();
            };
            const dropDiscarded = () => {
                for (const discardedClient of discarded)
                    discardedClient.discard();
            };
            const failIfIdle = (error) => {
                pending -= 1;
                lastError = error;
                if (settled)
                    return;
                if (pending === 0) {
                    settled = true;
                    clearTimeout(graceTimer);
                    dropDiscarded();
                    this.emit('offline', null, error.message);
                    reject(error);
                }
            };
            const finishOk = (route, client) => {
                if (settled) {
                    discard(client);
                    return;
                }
                if (route === 'direct' && !graceOpen) {
                    discard(client);
                    failIfIdle(lastError ?? new TunnelError('offline', 'Direct finished after grace window'));
                    return;
                }
                settled = true;
                clearTimeout(graceTimer);
                dropDiscarded();
                resolve(this.accept(route, client));
            };
            const finishErr = (error, terminal) => {
                lastError = error;
                pending -= 1;
                if (settled)
                    return;
                if (terminal || pending === 0) {
                    settled = true;
                    clearTimeout(graceTimer);
                    dropDiscarded();
                    this.emit('offline', null, error.message);
                    reject(error);
                }
            };
            for (const route of attempts) {
                void this.startRoute(route).then(client => finishOk(route, client), error => {
                    const failure = error instanceof Error ? error : new TunnelError('offline', String(error));
                    finishErr(failure, !mayFallbackAfter(error));
                });
            }
        });
    }
    accept(route, client) {
        this.client = client;
        this.route = route;
        this.emit(route === 'direct' ? 'direct-open' : 'tunnel-open', route);
        return client;
    }
    async probe(timeoutMs) {
        if (this.client === null)
            throw new TunnelError('closed', 'no Active Host connection');
        await this.client.probe(timeoutMs);
    }
    close() {
        const client = this.client;
        this.client = null;
        this.route = null;
        client?.close();
    }
    emit(phase, route, error) {
        this.options.onState?.({ phase, route, ...(error === undefined ? {} : { error }) });
    }
}
//# sourceMappingURL=connection-manager.js.map