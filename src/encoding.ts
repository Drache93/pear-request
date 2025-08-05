import c from "compact-encoding";

// @ts-ignore
import { compile, header } from "compact-encoding-struct";

export const requestEncoding = compile({
  id: c.string,
  body: c.buffer,
  url: c.string,
  method: c.string,
});

export const responseEncoding = compile({
  //   size: header(c.uint32),
  //   chunks: header(c.uint32),
  id: c.string,
  body: c.buffer,
  headers: c.json, // TODO: Make a 'record' type of encoding for string -> string
  status: c.uint16,
  //   hasMore: c.bool,
});
