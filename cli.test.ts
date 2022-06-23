import { assertEquals } from "https://deno.land/std@0.141.0/testing/asserts.ts";
import { semver } from "./deps.ts";

Deno.test("semver", () => {
  assertEquals(semver.inc("1.0.0", "patch", undefined, undefined), "1.0.1");
  assertEquals(semver.inc("1.0.0", "minor", undefined, undefined), "1.1.0");
  assertEquals(semver.inc("1.0.0", "major", undefined, undefined), "2.0.0");
  assertEquals(
    semver.inc("1.0.0", "prepatch", undefined, "canary"),
    "1.0.1-canary.0",
  );
  assertEquals(
    semver.inc("1.0.0-canary.1", "patch", undefined, "canary"),
    "1.0.0",
  );
  assertEquals(
    semver.inc("1.0.0", "prerelease", undefined, "canary"),
    "1.0.1-canary.0",
  );
  assertEquals(
    semver.inc("1.0.1-canary.0", "prerelease", undefined, "canary"),
    "1.0.1-canary.1",
  );
});
