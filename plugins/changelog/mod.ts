import { join } from "./deps.ts";

import type { ReleasePlugin } from "../../plugin.ts";
import {
  Document,
  filters,
  polyfillVersion,
  pushHeader,
  pushTag,
  render,
} from "../../src/changelog.ts";

const plugin: ReleasePlugin = {
  name: "Changelog",
  async preCommit(
    repo,
    _releaseType,
    _from,
    to,
    config,
    log,
  ): Promise<void> {
    const doc: Document = { sections: [], links: [] };
    pushHeader(doc);

    const [tags, commits] = polyfillVersion(repo, to);

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const belonging = commits.filter((_) => _.belongs?.hash === tag.hash);
      pushTag(doc, repo, belonging, filters, tag, "md");
    }

    const md = render(doc);
    if (!config.options.dry) {
      await Deno.writeTextFile(join(repo.path, "CHANGELOG.md"), md);
    } else {
      log.info(md);
    }
  },
};

export default plugin;
