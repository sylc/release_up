import { assertEquals } from "jsr:@std/assert@0.225.3";

import { parseCommit } from "./commits.ts";

// Deno.test("fetchRawCommits", async () => {
//   const t = await fetchRawCommits(".");
//   console.log(t);
// });

Deno.test("parseCommit", () => {
  assertEquals(parseCommit("chore: release 0.2.1-canary.0"), {
    header: "release 0.2.1-canary.0",
    type: "chore",
  });
  assertEquals(parseCommit("fix(test): my test (#65)"), {
    header: "my test (#65)",
    type: "fix",
  });
  assertEquals(parseCommit("random test"), {
    header: "random test",
    type: null,
  });
});
