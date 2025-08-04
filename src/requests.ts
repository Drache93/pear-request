import b4a from "b4a";

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
    response?: Buffer;
    status?: number;
    statusText?: string;

    static _pendingRequests: Record<string, PearRequest> = {};

    onload?: () => void;

    getAllResponseHeaders() {
      return {
        ...this._responseHeaders,
      };
    }

    get responseText() {
      return this.response?.toString("utf-8");
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

      pipe.write(
        b4a.from(
          JSON.stringify({
            id: id,
            method: this.method,
            url: this.url,
            body: body,
          }),
          "utf-8"
        )
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
    const message = b4a.toString(data, "utf-8");
    const { id, body, headers } = JSON.parse(message);

    const pendingRequest = pendingRequests[id];
    if (pendingRequest) {
      pendingRequest.readyState = 4;
      pendingRequest.response = body;
      pendingRequest._responseHeaders = headers;
      pendingRequest.status = 200;
      pendingRequest.statusText = "OK";

      pendingRequest["onload"]?.();
    }
  });

  return PearRequest;
}
