import { TunnelError } from './errors.ts';
import type { TunnelSession } from './client.ts';
/** Pending demux entry for one in-flight tunneled request. */
export interface PendingFetch {
    onHead(status: number, headers: Record<string, string>, bodyB64: string | undefined): void;
    onData(dataB64: string, last: boolean): void;
    onAbort(error: TunnelError): void;
}
/**
 * Fetch over the tunnel (http-req/http-data to http-res/http-data).
 *
 * Completeness rule (disambiguation of tunnel-protocol.md section 3, to be
 * confirmed with the M3-A host side): the head frame carries a body field —
 * even as an empty string — if and only if the body is complete in that
 * frame; a chunked body omits body from the head and streams http-data
 * frames until last:true.
 *
 * @param session live tunnel session.
 * @param path request path including query (e.g. /api/host.describe).
 * @param init subset of RequestInit: method/headers/body/signal.
 * @returns a real Response assembled from the response frames.
 */
export declare function tunnelFetch(session: TunnelSession, path: string, init?: {
    method?: string;
    headers?: HeadersInit;
    body?: string | ArrayBuffer | Uint8Array | Blob | URLSearchParams | null;
    signal?: AbortSignal | null;
}): Promise<Response>;
//# sourceMappingURL=http.d.ts.map