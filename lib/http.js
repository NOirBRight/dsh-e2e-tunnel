import { b64decode, b64encode, concat, utf8Encode } from "./bytes.js";
import { TunnelError } from "./errors.js";
/** Plaintext frame limit is 200 KiB; chunks keep the JSON envelope well below. */
const BODY_CHUNK = 120 * 1024;
function tooLarge(direction, maxHttpBodyBytes, actualHttpBodyBytes) {
    return new TunnelError('too-large', 'HTTP ' + direction + ' body exceeds ' + maxHttpBodyBytes + ' bytes', { direction, maxHttpBodyBytes, actualHttpBodyBytes });
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
export function tunnelFetch(session, path, init) {
    return new Promise((resolve, reject) => {
        const id = session.mintId();
        const parts = [];
        let head = null;
        let settled = false;
        const limit = session.maxHttpBodyBytes;
        let responseBytes = 0;
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            session.dropFetch(id);
            reject(error);
        };
        const finish = () => {
            if (settled || head === null)
                return;
            settled = true;
            session.dropFetch(id);
            const responseHead = head;
            void decodeResponseBody(concat(...parts), responseHead.encoding).then((body) => {
                // concat()/decodeResponseBody return a fresh array over a real ArrayBuffer;
                // the cast satisfies TS 5.7+ generic-Uint8Array BodyInit narrowing.
                resolve(new Response(body.length > 0 ? body : null, { status: responseHead.status, headers: responseHead.headers }));
            }, reject);
        };
        const pushResponse = (chunk) => {
            responseBytes += chunk.length;
            if (responseBytes > limit) {
                fail(tooLarge('response', limit, responseBytes));
                return false;
            }
            parts.push(chunk);
            return true;
        };
        const pending = {
            onHead(status, headers, bodyB64, encoding) {
                head = { status, headers, encoding };
                if (bodyB64 !== undefined) {
                    if (!pushResponse(b64decode(bodyB64)))
                        return;
                    finish();
                }
            },
            onData(dataB64, last) {
                if (!pushResponse(b64decode(dataB64)))
                    return;
                if (last)
                    finish();
            },
            onAbort: fail,
        };
        session.registerFetch(id, pending);
        void (async () => {
            try {
                const bodyBytes = await bodyToBytes(init ? init.body : undefined, limit);
                if (bodyBytes.length > limit)
                    throw tooLarge('request', limit, bodyBytes.length);
                const message = {
                    t: 'http-req',
                    id,
                    method: init && init.method ? init.method : 'GET',
                    path,
                    headers: headersToPlain(init ? init.headers : undefined),
                };
                if (bodyBytes.length <= BODY_CHUNK) {
                    message.body = b64encode(bodyBytes); // always present: completeness marker
                    session.send(message);
                }
                else {
                    session.send(message); // no body field: continuation follows
                    for (let offset = 0; offset < bodyBytes.length; offset += BODY_CHUNK) {
                        const slice = bodyBytes.subarray(offset, offset + BODY_CHUNK);
                        session.send({ t: 'http-data', id, data: b64encode(slice), last: offset + BODY_CHUNK >= bodyBytes.length });
                    }
                }
            }
            catch (error) {
                fail(error);
            }
        })();
        if (init && init.signal) {
            init.signal.addEventListener('abort', () => {
                fail(new DOMException('The operation was aborted.', 'AbortError'));
            }, { once: true });
        }
    });
}
async function decodeResponseBody(body, encoding) {
    if (encoding === undefined)
        return body;
    if (encoding !== 'gzip')
        throw new TunnelError('handshake', 'unsupported response encoding: ' + encoding);
    const stream = new Blob([body]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function bodyToBytes(body, limit) {
    if (body === null || body === undefined)
        return new Uint8Array(0);
    if (typeof body === 'string')
        return utf8Encode(body);
    if (body instanceof Uint8Array)
        return body;
    if (body instanceof ArrayBuffer)
        return new Uint8Array(body);
    if (isByteStream(body)) {
        const chunks = [];
        let size = 0;
        const reader = body.getReader();
        for (;;) {
            const { done, value } = await reader.read();
            if (done)
                break;
            if (value === undefined)
                continue;
            const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
            size += chunk.length;
            if (size > limit) {
                try {
                    await reader.cancel();
                }
                catch { /* already closed */ }
                throw tooLarge('request', limit, size);
            }
            chunks.push(chunk);
        }
        return concat(...chunks);
    }
    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams)
        return utf8Encode(body.toString());
    if (typeof Blob !== 'undefined' && body instanceof Blob)
        return new Uint8Array(await body.arrayBuffer());
    throw new TunnelError('handshake', 'unsupported request body type');
}
function isByteStream(body) {
    return typeof body === 'object' && body !== null && typeof body.getReader === 'function';
}
function headersToPlain(headers) {
    if (!headers)
        return {};
    if (headers instanceof Headers) {
        const out = {};
        headers.forEach((value, key) => { out[key] = value; });
        return out;
    }
    if (Array.isArray(headers)) {
        const out = {};
        for (const entry of headers)
            out[entry[0]] = entry[1];
        return out;
    }
    return { ...headers };
}
//# sourceMappingURL=http.js.map