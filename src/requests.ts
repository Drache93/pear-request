import b4a from "b4a";
import cenc from "compact-encoding";
import { requestEncoding, responseEncoding } from "./encoding";
import type { RequestContext, ResponseContext } from "./types";

export function create(pipe: any) {
  // TODO: clean up any leftovers
  const pendingRequests: Record<string, PearRequest> = {};

  class PearRequestUpload {
    events: Record<string, (event: any) => void> = {};

    addEventListener(event: string, callback: (event: any) => void) {
      this.events[event] = callback;
    }
  }

  class PearRequest {
    method?: string;
    url?: string;
    mimeType?: string;

    readyState: number = 0;
    headers: Record<string, string> = {};
    events: Record<string, (event: any) => void> = {};

    _responseHeaders?: Record<string, string>;
    _response?: Buffer;
    status?: number;
    statusText?: string;

    static _pendingRequests: Record<string, PearRequest> = {};

    onload?: () => void;

    getAllResponseHeaders() {
      return {
        ...this._responseHeaders,
      };
    }

    get response() {
      if (!this._response) {
        return null;
      }

      if (this.mimeType === "application/json") {
        return JSON.parse(b4a.toString(this._response, "utf-8"));
      } else if (this.mimeType?.startsWith("text/")) {
        return b4a.toString(this._response, "utf-8");
      } else {
        return this._response;
      }
    }

    get responseText() {
      return this._response?.toString("utf-8");
    }

    get responseType() {
      return this.mimeType;
    }

    open(method: string, url: string) {
      this.method = method;
      this.url = url;
      this.readyState = 1;
    }

    send(body: any) {
      const id = crypto.randomUUID();

      this.readyState = 2;

      pendingRequests[id] = this;

      const buff = !body
        ? Buffer.alloc(0)
        : Buffer.isBuffer(body)
        ? body
        : Buffer.from(body, "utf-8");

      pipe.write(
        cenc.encode(requestEncoding, {
          id: id,
          method: this.method,
          url: this.url,
          body: buff,
        })
      );
    }

    upload = new PearRequestUpload();

    overrideMimeType(mimeType: string) {
      this.mimeType = mimeType;
    }

    setRequestHeader(header: string, value: string) {
      this.headers[header] = value;
    }

    addEventListener(event: string, callback: (event: any) => void) {
      this.events[event] = callback;
    }
  }

  pipe.on("data", (data: Uint8Array) => {
    const { id, body, headers } = cenc.decode<ResponseContext>(
      responseEncoding,
      data
    );

    const pendingRequest = pendingRequests[id];
    if (pendingRequest) {
      pendingRequest.readyState = 4;
      // TODO: handle body type
      pendingRequest._response = body;
      pendingRequest._responseHeaders = headers;
      pendingRequest.status = 200;
      pendingRequest.statusText = "OK";

      pendingRequest["onload"]?.();
    }
  });

  return PearRequest;
}
