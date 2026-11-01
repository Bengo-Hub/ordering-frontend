/**
 * Pull a list out of an API body that may be a bare array or an envelope such as
 * `{ data: [...] }`, `{ roles: [...] }` or `{ data: null }`. Go services encode an empty
 * nil slice as `null`, and a gated route can answer with an object, so callers that spread,
 * sort or map the result must always get an array back. Keys are tried in order.
 */
export function listFrom<T>(body: unknown, ...keys: string[]): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of keys.length ? keys : ["data"]) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}
