import { describe, expect, it } from "vitest";

import { pushRecent, RECENT_LIMIT, type RecentItem } from "@/store/recently-viewed";

const item = (id: string, viewedAt = 0): RecentItem => ({ id, name: id, priceLabel: "KES 1", viewedAt });

describe("recently viewed", () => {
  it("puts the latest view first and drops its older copy", () => {
    const list = pushRecent([item("a"), item("b")], item("b", 5));
    expect(list.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it(`keeps at most ${RECENT_LIMIT}`, () => {
    let list: RecentItem[] = [];
    for (let i = 0; i < RECENT_LIMIT + 5; i++) list = pushRecent(list, item(String(i)));
    expect(list).toHaveLength(RECENT_LIMIT);
    expect(list[0]?.id).toBe(String(RECENT_LIMIT + 4));
  });
});
