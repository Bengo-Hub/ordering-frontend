// Sibling app URLs, overridable per environment. One place so links never drift.
export const LOGISTICS_UI_URL = (
  process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexafrica.com"
).replace(/\/+$/, "");
