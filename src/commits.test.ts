import { assertEquals } from "jsr:@std/assert@0.225.3";

import { parseCommit } from "./commits.ts";


Deno.test("parseCommit", () => {
  assertEquals(parseCommit("chore: release 0.2.1-canary.0"), {
    header: "chore: release 0.2.1-canary.0",
    type: "chore",
    subject: "release 0.2.1-canary.0",
  });
  assertEquals(parseCommit("fix(test): my test (#65)"), {
    header: "fix(test): my test (#65)",
    type: "fix",
    subject: "my test (#65)",
  });
  assertEquals(parseCommit("random test"), {
    header: "random test",
    type: null,
    subject: null,
  });
});
