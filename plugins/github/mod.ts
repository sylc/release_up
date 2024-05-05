import type { ReleasePlugin } from "../../plugin.ts";
import {
  type Document,
  polyfillVersion,
  pushTag,
  render,
  significantCommits,
} from "../../src/changelog.ts";

import * as gh from "./api.ts";
import { ReleaseError } from "../../src/error.ts";

const GITHUB_TOKEN = "GITHUB_TOKEN";

interface GithubConfig {
  github?: {
    /**
     * Perform a release. Can also be set to 'draft' to perform a draft release.
     * The default is true
     */
    release?: boolean | "draft";
  };
}

const plugin: ReleasePlugin<GithubConfig> = {
  name: "GitHub",
  async setup(log): Promise<void> {
    const token = Deno.env.get(GITHUB_TOKEN);
    if (!token) {
      log.error("GitHub token not found!");
      log.error("Please set your github token as environment variable");
      Deno.exit(1);
    }
    const res = await gh.verifyToken(token);
    if (!res.ok || !token) {
      log.critical(`GitHub token is not valid! (err: ${res.err})`);
      Deno.exit(1);
    }
  },
  async postCommit(
    repo,
    releaseType,
    _from,
    to,
    config,
    log,
  ): Promise<void> {
    if (!repo.remote || !repo.remote.github) return;
    const doc: Document = { sections: [], links: [] };

    const [tags, commits] = polyfillVersion(repo, to);

    const latest = tags[0];
    const belonging = commits.filter((_) => _.belongs?.hash === latest.hash);
    const parent = tags.length > 0 ? tags[1] : undefined;
    pushTag(doc, repo, belonging, significantCommits, latest, "github", parent);

    if (!config.options.dry) {
      const token = Deno.env.get(GITHUB_TOKEN)!;
      const { user, name } = repo.remote.github;
      const result = await gh.createRelease(token, user, name, {
        tag_name: to,
        name: `v${to}`,
        body: render(doc),
        prerelease: releaseType.startsWith("pre"),
        draft: config.github?.release === "draft",
      });
      if (!result.ok) throw new ReleaseError("PLUGIN", result.err);
    } else {
      log.info("dryRun: skipping creating release");
    }
  },
};

export default plugin;
