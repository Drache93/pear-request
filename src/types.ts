export interface RequestContext {
  method: string;
  url: string;
  body?: any;
  id: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  //   query?: URLSearchParams;
}

export interface ResponseContext {
  id: string;
  body: Buffer | null;
  headers?: Record<string, string>;
  status?: number;
  hasMore?: boolean;
}
