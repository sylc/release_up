import type {
  Action,
  ReleaseConfig,
  ReleasePlugin,
  Repo,
} from "../../plugin.ts";
import { EOL, join } from "./deps.ts";

/**
 * Export a version file with the new version number
 */
export const versionFile = <ReleasePlugin> {
  name: "versionFile",
  async preCommit(
    repo: Repo,
    _action: Action,
    _from: string,
    to: string,
    config: ReleaseConfig,
  ): Promise<void> {
    const versionFile = "version.json";
    const version = {
      version: to,
    };
    if (!config.dry) {
      await Deno.writeTextFile(
        join(repo.path, versionFile),
        JSON.stringify(version, null, 2) +
          // to comply with deno fmt
          "\n",
      );
    } else {
      console.log(versionFile);
    }
  },
};
