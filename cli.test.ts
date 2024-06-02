import { assertEquals } from "jsr:@std/assert@0.225.3";
import { semver } from "./deps.ts";

Deno.test("semver", () => {
  assertEquals(
    semver.format(
      semver.increment(semver.parse("1.0.0"), "patch", undefined, undefined),
    ),
    "1.0.1",
  );
  assertEquals(
    semver.format(
      semver.increment(semver.parse("1.0.0"), "minor", undefined, undefined),
    ),
    "1.1.0",
  );
  assertEquals(
    semver.format(
      semver.increment(semver.parse("1.0.0"), "major", undefined, undefined),
    ),
    "2.0.0",
  );
  assertEquals(
    semver.format(
      semver.increment(semver.parse("1.0.0"), "prepatch", "canary"),
    ),
    "1.0.1-canary.0",
  );
  assertEquals(
    semver.format(
      semver.increment(semver.parse("1.0.0-canary.1"), "patch", "canary"),
    ),
    "1.0.0",
  );
  assertEquals(
    semver.format(
      semver.increment(semver.parse("1.0.0"), "prerelease", "canary"),
    ),
    "1.0.1-canary.0",
  );
  assertEquals(
    semver.format(
      semver.increment(semver.parse("1.0.1-canary.0"), "prerelease", "canary"),
    ),
    "1.0.1-canary.1",
  );
});
