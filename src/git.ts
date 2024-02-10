import { ini, join } from "../deps.ts";

import { ReleaseError } from "./error.ts";

const decoder = new TextDecoder();

export function git(
  repo: string,
  args: string[] | string,
): [boolean, string, string] {
  const dir = `--git-dir=${join(repo, ".git")}`;
  if (typeof args === "string") args = args.split(" ");

  const cmd = new Deno.Command("git", {
    args: [dir, ...args],
  });
  const process = cmd.outputSync();
  return [
    process.success,
    decoder.decode(process.stdout),
    decoder.decode(process.stderr),
  ];
}

export function ezgit(
  repo: string,
  args: string[] | string,
): void {
  const [success, _, err] = git(repo, args);
  if (!success) throw new ReleaseError("GIT_EXE", err);
}

export async function fetchConfig(repo: string): Promise<GitConfig> {
  const path = join(repo, ".git", "config");
  let source = await Deno.readTextFile(path);
  source = source.replace(/\[(\S+) "(.*)"\]/g, (m, $1, $2) => {
    return $1 && $2 ? `[${$1} "${$2.split(".").join("\\.")}"]` : m;
  });
  const config = ini.decode(source);
  for (const key of Object.keys(config)) {
    const m = /(\S+) "(.*)"/.exec(key);
    if (!m) continue;
    const prop = m[1];
    config[prop] = config[prop] || {};
    config[prop][m[2]] = config[key];
    delete config[key];
  }
  return config;
}

interface GitConfigCore {
  [key: string]: unknown;
}

export interface Remote {
  url: string;
  fetch: string;
  [key: string]: unknown;
}

interface GitConfigRemote {
  [key: string]: Remote;
}

export interface Branch {
  remote: string;
  merge: string;
  [key: string]: unknown;
}

interface GitConfigBranch {
  [key: string]: Branch;
}

export interface GitConfig {
  core: GitConfigCore;
  remote: GitConfigRemote;
  branch: GitConfigBranch;
}
