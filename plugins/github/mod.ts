import { log } from "./deps.ts";

import { Action, ReleaseConfig, ReleasePlugin, Repo } from "../../plugin.ts";
import {
  Document,
  Filter,
  polyfillVersion,
  pushTag,
  render,
} from "../../src/changelog.ts";

import * as gh from "./api.ts";
import { ReleaseError } from "../../src/error.ts";

const logger = log.create("gh");

const GITHUB_TOKEN = "GITHUB_TOKEN";

export const github = <ReleasePlugin> {
  name: "GitHub",
  async setup(): Promise<void> {
    const token = Deno.env.get(GITHUB_TOKEN);
    if (!token) {
      logger.warning("GitHub token not found!");
      logger.info("Please set your github token as environment variable");
      Deno.exit(0);
    }
    const res = await gh.verifyToken(token);
    if (!res.ok || !token) {
      logger.critical(`GitHub token is not valid! (err: ${res.err})`);
      Deno.exit(1);
    }
  },
  async postCommit(
    repo: Repo,
    action: Action,
    _from: string,
    to: string,
    config: ReleaseConfig,
  ): Promise<void> {
    if (!repo.remote || !repo.remote.github) return;
    const doc: Document = { sections: [], links: [] };

    const [tags, commits] = polyfillVersion(repo, to);
    const filters: Filter[] = [
      {
        type: "feat",
        title: "Features",
      },
      {
        type: "fix",
        title: "Bug Fixes",
      },
    ];

    const latest = tags[0];
    const parent = tags[1];
    const belonging = commits.filter((_) => _.belongs?.hash === latest.hash);
    pushTag(doc, repo, belonging, filters, latest, parent, "Changelog");

    if (!config.dry) {
      const token = Deno.env.get(GITHUB_TOKEN)!;
      const { user, name } = repo.remote.github;
      const result = await gh.createRelease(token, user, name, {
        tag_name: to,
        name: `v${to}`,
        body: render(doc),
        prerelease: action.startsWith("pre"),
        draft: true,
      });
      if (!result.ok) throw new ReleaseError("PLUGIN", result.err);
    }
  },
};
