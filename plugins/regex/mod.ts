import type { ReleasePlugin } from "../../plugin.ts";
import { join } from "./deps.ts";

interface RegexConfig {
  regex: {
    file: string, 
    patterns: string 
  }[] | { patterns: string};
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
    if (!Array.isArray(config.regex) && config.regex.patterns.length) {
      changeDefs.push({
        filePath: "README.md",
        transforms: [
          { value: to, patterns: config.regex.patterns || [] },
        ],
      })
    }
    if (Array.isArray(config.regex)) {
      config.regex.forEach(p => {
        changeDefs.push({
          filePath: p.file,
          transforms: [
            { value: to, patterns: p.patterns },
          ],
        })
      })
    }

    // aggregate all patterns per file
    const t = Object.groupBy(changeDefs, ({filePath}) => filePath)

    for (const [filePath, changeDefsForFile]of Object.entries(t)) {
      log.info(`processing: ${filePath}`);

      let text = await Deno.readTextFile(filePath);
      // apply regex.
      for (const changeDef of changeDefsForFile!) {
        for (const transforms of changeDef.transforms) {
          for (const pattern of transforms.patterns) {
            log.debug(`regex: ${new RegExp(pattern)}`)
            text = text.replace(new RegExp(pattern), transforms.value);
          }
        }
      }
      if (config.options.dry) {
        log.info(text);
      } else {
        await Deno.writeTextFile(join(repo.path, filePath), text);
      }
    }
  },
};

export default plugin;
