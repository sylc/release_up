import { git } from "./git.ts";
import { ReleaseError } from "./error.ts";

export function fetchBranch(repo: string): string {
  const [success, output, err] = git(repo, "rev-parse --abbrev-ref HEAD");
  if (!success) throw new ReleaseError("GIT_EXE", err);
  return output.trim();
}
