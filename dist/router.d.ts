export interface RequestContext {
    method: string;
    url: string;
    body?: any;
    id: string;
    headers?: Record<string, string>;
}
export interface ResponseContext {
    id: string;
    body: string;
    headers?: Record<string, string>;
    status?: number;
}
export type RouteHandler = (req: RequestContext, res: ResponseContext) => void | Promise<void>;
export interface Route {
    method: string;
    path: string;
    handler: RouteHandler;
}
export declare class PearRequestRouter {
    private routes;
    private pipe;
    constructor(pipe: any);
    route(method: string, path: string, handler: RouteHandler): void;
    get(path: string, handler: RouteHandler): void;
    put(path: string, handler: RouteHandler): void;
    post(path: string, handler: RouteHandler): void;
    delete(path: string, handler: RouteHandler): void;
    private sendResponse;
    handleRequest(request: RequestContext): Promise<void>;
    processMessage(message: any): Promise<void>;
}
