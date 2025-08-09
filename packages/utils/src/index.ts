export const ok = <T>(v: T) => v;
export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
export function assert(cond: unknown, msg = "Assertion failed"): asserts cond {
  if (!cond) throw new Error(msg);
}
