import { colors, delay, log, semver, wait } from "./deps.ts";
import { Command, EnumType } from "./deps.ts";

import type { ReleaseConfig } from "./config.ts";
import { fetchRepo, Repo } from "./src/repo.ts";
import { ezgit } from "./src/git.ts";

// Plugins
import { github } from "./plugins/github/mod.ts";
import { changelog } from "./plugins/changelog/mod.ts";
import { regex } from "./plugins/regex/mod.ts";
import { versionFile } from "./plugins/versionFile/mod.ts";

import version from "./version.json" assert { type: "json" };
import { ReleasePlugin } from "./plugin.ts";
import { initLogger } from "./src/log.ts";

export type ReleaseType =
  | "patch"
  | "minor"
  | "major"
  | "prepatch"
  | "preminor"
  | "premajor";

const actions: ReleaseType[] = [
  "patch",
  "minor",
  "major",
  "prepatch",
  "preminor",
  "premajor",
];

await new Command()
  .name("release-me")
  .version(version.version)
  .description(
    `Automate semver release tasks

    release type:
      * patch             ${colors.dim("eg: 1.2.3 -> 1.2.4")}
      * minor             ${colors.dim("eg: 1.2.3 -> 1.3.0")}
      * major             ${colors.dim("eg: 1.2.3 -> 2.0.0")}
      * prepatch <name>   ${colors.dim("eg: 1.2.3 -> 1.2.4-name")}
      * preminor <name>   ${colors.dim("eg: 1.2.3 -> 1.2.4-name")}
      * premajor <name>   ${colors.dim("eg: 1.2.3 -> 1.2.4-name")}`,
  )
  .type("semver", new EnumType(actions))
  .arguments("<release_type:semver>  [name:string]")
  .option("--dry", "Dry run, Does not commit any changes")
  .option("--debug", "enable debug logging")
  .option("--allowUncommitted", "Allow uncommited change in the repo")
  .option("--config <confi_path>", "define the path of the config", {
    default: ".release-me.json",
  })
  .action(async (opts, release_type, name) => {
    await initLogger(opts.debug)
    log.debug(opts, release_type, name);
    
    let suffix: string | undefined = undefined;
    if (["prepatch", "preminor", "premajor"].includes(release_type)) {
      suffix = (name as string | undefined) ?? "canary";
    }

    // Load config, if any
    let config: ReleaseConfig<unknown> = { options: opts };
    try {
      config = { ...(JSON.parse(Deno.readTextFileSync(opts.config))), ...config} ;
    } catch (err) {
      if (err.code !== "ENOENT") {
        log.error(`error parsing the config file at ${opts.config}`);
        log.error(err);
        Deno.exit(1);
      }
    }

    // deno-lint-ignore no-explicit-any
    const plugins: ReleasePlugin<any>[] = [];
    for (const [key, val] of Object.entries(config)) {
      if (key === "options") continue;
      if (key === "github") plugins.push(github);
      else if (key === "changelog") plugins.push(changelog);
      else if (key === "regex") plugins.push(regex);
      else if (key === "versionFile") plugins.push(versionFile);
      else {
        const def = val as { path: string; };
        if (!def.path) throw Error(`Invalid config entry ${val}`)
        const remotePlugin = await import(def.path) 
        plugins.push(remotePlugin); 
      }
    }
        
    log.debug(`plugins loaded: ${plugins.map(p => p.name).join(', ')}`)

    // Plugins setup
    for (const plugin of plugins) {
      if (!plugin.setup) continue;
      try {
        await plugin.setup(log);
      } catch (err) {
        log.critical(err.message);
        Deno.exit(1);
      }
    }

    // Load Repo
    const fetch = wait("Loading project info").start();
    let repo: Repo;
    try {
      repo = await fetchRepo(Deno.cwd());
    } catch (err) {
      fetch.fail(Deno.inspect(err));
      Deno.exit(1);
    }
    fetch.succeed("Project loaded correctly");

    const [latest] = repo.tags;
    const from = latest ? latest.version : "0.0.0";
    const to = semver.inc(from, release_type, undefined, suffix)!;

    const integrity = wait("Checking the project").start();
    await delay(1000);
    if (repo.status.raw.length !== 0) {
      if (opts.allowUncommitted) {
        integrity.fail(
          "Uncommitted changes on your repository - allowUncommitted is true passing... ",
        );
      } else {
        integrity.fail("Uncommitted changes on your repository!");
        Deno.exit(1);
      }
    } else if (!repo.commits.some((_) => _.belongs === null)) {
      integrity.fail(`No changes since the last release!`);
      Deno.exit(1);
    }
    integrity.succeed("Project check successful");

    // Precommit
    for (const plugin of plugins) {
      if (!plugin.preCommit) continue;
      try {
        log.debug(`Executing preCommit ${plugin.name}`)
        await plugin.preCommit(repo, release_type, from, to, config, log);
      } catch (err) {
        log.critical(err.message);
        Deno.exit(1);
      }
    }

    try {
      repo = await fetchRepo(Deno.cwd());
    } catch (err) {
      log.critical(err.message);
      Deno.exit(1);
    }

    const bump = wait(
      `Releasing ${colors.bold(to)} ${colors.dim(`(latest was ${from})`)}`,
    ).start();

    if (!opts.dry) {
      try {
        await ezgit(repo.path, "add -A");
        await ezgit(repo.path, [
          "commit",
          "--allow-empty",
          "--message",
          `chore: release ${to}`,
        ]);
        await ezgit(repo.path, `tag ${to}`);
        await ezgit(repo.path, "push");
        await ezgit(repo.path, "push --tags");
      } catch (err) {
        bump.fail(`Unable to release ${colors.bold(to)}\n`);
        log.critical(err.message);
        Deno.exit(1);
      }
      bump.succeed(`Released ${colors.bold(to)}!`);
    } else {
      bump.warn(
        `Skipping release ${colors.bold(to)} ${
          colors.dim(
            `(latest was ${from})`,
          )
        }`,
      );
    }

    for (const plugin of plugins) {
      if (!plugin.postCommit) continue;
      try {
        log.debug(`Executing postCommit ${plugin.name}`)
        await plugin.postCommit(repo, release_type, from, to, config, log);
      } catch (err) {
        log.critical(err.message);
        Deno.exit(1);
      }
    }
  })
  .parse(Deno.args);
