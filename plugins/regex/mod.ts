
import type {
  Action,
  ReleaseConfig,
  ReleasePlugin,
  Repo,
} from "../../plugin.ts";
import { join } from "./deps.ts";

export const regex = <ReleasePlugin> {
  name: "Regex",
  async preCommit(
    repo: Repo,
    _action: Action,
    _from: string,
    to: string,
    config: ReleaseConfig,
  ): Promise<void> {

    const readmePath = "README.md"
    let text = await Deno.readTextFile(readmePath)
    // apply regex. This should come from a config loaded on setup step
    // as a prototype, it is harcoded to update versions in urls
    text = text.replace(/(?<=@)(.*)(?=\/)/gm, to)
    if (!config.dry) {
      await Deno.writeTextFile(join(repo.path, readmePath), text);
    } else {
      console.log(text);
    }
  },
};
