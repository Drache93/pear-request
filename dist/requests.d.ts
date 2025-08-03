export declare function create(pipe: any): {
    new (): {
        method?: string;
        url?: string;
        mimeType?: string;
        readyState: number;
        headers: Record<string, string>;
        events: Record<string, (event: any) => void>;
        _responseHeaders?: Record<string, string>;
        response?: Buffer;
        status?: number;
        statusText?: string;
        onload?: () => void;
        getAllResponseHeaders(): {
            [x: string]: string;
        };
        readonly responseText: string | undefined;
        readonly responseType: string | undefined;
        open(method: string, url: string): void;
        send(body: any): void;
        upload: {
            events: Record<string, (event: any) => void>;
            addEventListener(event: string, callback: (event: any) => void): void;
        };
        overrideMimeType(mimeType: string): void;
        setRequestHeader(header: string, value: string): void;
        addEventListener(event: string, callback: (event: any) => void): void;
    };
    _pendingRequests: Record<string, {
        method?: string;
        url?: string;
        mimeType?: string;
        readyState: number;
        headers: Record<string, string>;
        events: Record<string, (event: any) => void>;
        _responseHeaders?: Record<string, string>;
        response?: Buffer;
        status?: number;
        statusText?: string;
        onload?: () => void;
        getAllResponseHeaders(): {
            [x: string]: string;
        };
        readonly responseText: string | undefined;
        readonly responseType: string | undefined;
        open(method: string, url: string): void;
        send(body: any): void;
        upload: {
            events: Record<string, (event: any) => void>;
            addEventListener(event: string, callback: (event: any) => void): void;
        };
        overrideMimeType(mimeType: string): void;
        setRequestHeader(header: string, value: string): void;
        addEventListener(event: string, callback: (event: any) => void): void;
    }>;
};
