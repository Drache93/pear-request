// src/encoding.ts
import c from "compact-encoding";
import { compile } from "compact-encoding-struct";
var requestEncoding = compile({
  id: c.string,
  body: c.buffer,
  url: c.string,
  method: c.string
});
var responseEncoding = compile({
  id: c.string,
  body: c.buffer,
  headers: c.json,
  status: c.uint16
});
export {
  responseEncoding,
  requestEncoding
};
