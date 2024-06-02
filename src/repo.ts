import { exists, join } from "../deps.ts";
import { ReleaseError } from "./error.ts";

import { fetchBranch } from "./branch.ts";
import { type Commit, fetchCommits } from "./commits.ts";
import { fetchTags, type Tag } from "./tags.ts";
import { fetchStatus, type Status } from "./status.ts";
import { fetchConfig, type GitConfig } from "./git.ts";

export interface Github {
  user: string;
  name: string;
}

export interface Remote {
  raw: string;
  github: Github | null;
}

export interface Repo {
  path: string;
  branch: string;
  remote: Remote | null;
  tags: Tag[];
  commits: Commit[];
  status: Status;
  config: GitConfig;
}

export async function fetchRepo(path: string): Promise<Repo> {
  const repo = join(path, ".git");
  if (!(await exists(repo))) {
    throw new ReleaseError("NO_REPO");
  }

  const branch = fetchBranch(path);
  if (branch === "HEAD") throw new ReleaseError("UNINITIALIZED_REPO");

  const config = await fetchConfig(path);

  let remote: Remote | null = null;
  if (config.branch && config.branch[branch]) {
    const branchRef = config.branch[branch];
    const remoteRef = config.remote[branchRef.remote];
    if (!remoteRef) {
      throw "The remote branch of this branch does not exist. Create it first.";
    }
    remote = {
      raw: remoteRef.url,
      github: null,
    };
    const reGithub =
      /(?:(?:https?:\/\/github\.com\/)|git@github\.com:)(.*)\/(.*)/;
    if (reGithub.test(remote.raw)) {
      const match = reGithub.exec(remote.raw);
      if (match) {
        remote.github = {
          user: match[1],
          name: match[2],
        };
        if (remote.github.name.endsWith(".git")) {
          remote.github.name = remote.github.name.replace(".git", "");
        }
      }
    }
  }

  const tags = fetchTags(path);
  const commits = await fetchCommits(path, tags);

  const status = fetchStatus(path);

  return {
    path,
    branch,
    remote,
    commits,
    tags,
    status,
    config,
  };
}
