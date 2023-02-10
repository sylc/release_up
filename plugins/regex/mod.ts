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

    // the below allow for future expansion to change more files
    const changeDefs = [];
    if (config.regex.patterns.length) {
      changeDefs.push({
        filePath: "README.md",
        transforms: [
          { value: to, patterns: config.regex.patterns || [] },
        ],
      })
    }

    for (const changeDef of changeDefs) {
      let text = await Deno.readTextFile(changeDef.filePath);
      // apply regex.
      for (const transforms of changeDef.transforms) {
        for (const pattern of transforms.patterns) {
          text = text.replace(new RegExp(pattern), transforms.value);
        }
      }
      if (config.options.dry) {
        log.info(text);
      } else {
        await Deno.writeTextFile(join(repo.path, changeDef.filePath), text);
      }
    }
  },
};

export default plugin;
