/** Tunnel error with a machine-readable code. */
export class TunnelError extends Error {
    /** Machine-readable failure reason: 'bad-offer' | 'expired' | 'bad-code' | 'handshake' | 'timeout' | 'closed' | 'seq-violation' | 'too-large' | host-sent codes. */
    code;
    /** Optional structured context (HTTP body limits, etc.). */
    details;
    constructor(code, message, details) {
        super(message ?? 'tunnel: ' + code);
        this.name = 'TunnelError';
        this.code = code;
        if (details !== undefined)
            this.details = details;
    }
}
/** tunnel-protocol.md section 4: advertised HTTP body cap. */
export const DEFAULT_MAX_HTTP_BODY_BYTES = 8 * 1024 * 1024;
//# sourceMappingURL=errors.js.map