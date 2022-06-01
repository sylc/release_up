import type { ReleasePlugin } from "../../plugin.ts";
import { join } from "./deps.ts";

interface RegexConfig {
  regex: {
    patterns: string[];
  };
}

const plugin: ReleasePlugin<RegexConfig> = {
  name: "Regex",
  async preCommit(
    repo,
    _releaseType,
    _from,
    to,
    config,
    log,
  ): Promise<void> {
    const readmePath = "README.md";
    let text = await Deno.readTextFile(readmePath);
    // apply regex. This should come from a config loaded on setup step
    // as a prototype, it is harcoded to update versions in urls
    for (const pattern of config.regex.patterns) {
      text = text.replace(new RegExp(pattern), to);
    }
    if (config.options.dry) {
      log.info(text);
    } else {
      await Deno.writeTextFile(join(repo.path, readmePath), text);
    }
  },
};

export default plugin;
