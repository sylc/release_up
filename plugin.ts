// force github update
import type { ReleaseConfig } from "./config.ts";
import type { Action } from "./cli.ts";
import type { Repo } from "./src/repo.ts";

export type { ReleaseConfig } from "./config.ts";
export type { Action } from "./cli.ts";
export type { Repo } from "./src/repo.ts";
export type { Tag } from "./src/tags.ts";
export type { Commit } from "./src/commits.ts";

export interface ReleasePlugin {
  name: string;
  setup?: () => Promise<void>;
  preCommit?: (
    repo: Repo,
    action: Action,
    from: string,
    to: string,
    config: ReleaseConfig,
  ) => Promise<void>;
  postCommit?: (
    repo: Repo,
    action: Action,
    from: string,
    to: string,
    config: ReleaseConfig,
  ) => Promise<void>;
}
