import type { ReleasePlugin } from "../../plugin.ts";
import { join } from "./deps.ts";

/**
 * Export a version file with the new version number
 */
const plugin: ReleasePlugin = {
  name: "TestRemote",
  async preCommit(
    repo,
    _releaseType,
    _from,
    to,
    config,
    log,
  ): Promise<void> {
    const versionFile = "versionTest.json";
    const version = {
      version: to,
    };
    if (!config.options.dry) {
      await Deno.writeTextFile(
        join(repo.path, versionFile),
        JSON.stringify(version, null, 2) +
          // to comply with deno fmt
          "\n",
      );
    } else {
      log.info(`dryRun: Would have created ${versionFile} file`);
    }
  },
};

export default plugin;
