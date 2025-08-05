import c from "compact-encoding";

// @ts-ignore
import { compile } from "compact-encoding-struct";

export const requestEncoding = compile({
  id: c.string,
  body: c.buffer,
  url: c.string,
  method: c.string,
});

export const responseEncoding = compile({
  id: c.string,
  body: c.buffer,
  headers: c.json, // TODO: Make a 'record' type of encoding for string -> string
  status: c.uint16,
});
