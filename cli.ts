import { colors, delay, log, semver, step } from "./deps.ts";
import { Command, EnumType } from "./deps.ts";

import type { ReleaseConfig } from "./config.ts";
import { fetchRepo, type Repo } from "./src/repo.ts";
import { ezgit } from "./src/git.ts";

// Plugins
import github from "./plugins/github/mod.ts";
import changelog from "./plugins/changelog/mod.ts";
import regex from "./plugins/regex/mod.ts";
import versionFile from "./plugins/versionFile/mod.ts";

import config from "./deno.json" with { type: "json" };
import type { ReleasePlugin } from "./plugin.ts";
import { initLogger } from "./src/log.ts";

const version = config.version;

export type ReleaseType =
  | "patch"
  | "minor"
  | "major"
  | "prepatch"
  | "preminor"
  | "premajor"
  | "prerelease";

const release_type: ReleaseType[] = [
  "patch",
  "minor",
  "major",
  "prepatch",
  "preminor",
  "premajor",
  "premajor",
  "prerelease",
];

const DEFAULT_CONFIG_PATH = ".release_up.json";

await new Command()
  .name("release_up")
  .version(version)
  .description(`
    Automate semver releases. 
    Example: release_up major --github

    Release type:
      * patch             ${colors.dim("eg: 1.2.3 -> 1.2.4")}
      * minor             ${colors.dim("eg: 1.2.3 -> 1.3.0")}
      * major             ${colors.dim("eg: 1.2.3 -> 2.0.0")}
      * prepatch <name>   ${colors.dim("eg: 1.2.3 -> 1.2.4-name.0")}
      * preminor <name>   ${colors.dim("eg: 1.2.3 -> 1.3.0-name.0")}
      * premajor <name>   ${colors.dim("eg: 1.2.3 -> 2.0.0-name.0")}
      * prerelease <name> ${colors.dim("eg: 1.2.3-name.0 -> 1.2.3-name.1")}`)
  .type("semver", new EnumType(release_type))
  .arguments("<release_type:semver> [name:string]")
  .option("--config <config_path>", "Define the path of the config.", {
    default: `${DEFAULT_CONFIG_PATH}`,
  })
  .option("--github", "Enable Github plugin.")
  .option("--changelog", "Enable Changelog plugin.")
  .option("--versionFile", "Enable VersionFile plugin.")
  .option(
    "--regex <file_and_pattern:string>",
    "Enable the Regex plugin. The regex argument is of format filepath:::regex eg: --regex 'README.md:::(?<=@)(.*)(?=\/cli)'. --regex can be specified multiple times.",
    { collect: true },
  )
  .option("--dry", "Dry run, Does not commit any changes.")
  .option("--allowUncommitted", "Allow uncommited change in the repo.")
  .option("--debug", "Enable debug logging.")
  .action(async (opts, release_type, name) => {
    await initLogger(opts.debug);
    log.debug(opts, release_type, name);

    let suffix: string | undefined = undefined;
    if (
      ["prepatch", "preminor", "premajor", "prerelease"].includes(release_type)
    ) {
      suffix = (name as string | undefined) ?? "canary";
    }

    // Load config, if any
    let config: ReleaseConfig<unknown> = { options: opts };
    try {
      config = {
        ...(JSON.parse(Deno.readTextFileSync(opts.config))),
        ...config,
      };
    } catch (err) {
      if (err.code === "ENOENT" && opts.config !== DEFAULT_CONFIG_PATH) {
        log.error(`Cannot find config file at ${opts.config}`);
        Deno.exit(1);
      }
      if (err.code !== "ENOENT") {
        log.error(`error parsing the config file at ${opts.config}`);
        log.error(err);
        Deno.exit(1);
      }
    }

    // Enable Plugins

    // deno-lint-ignore no-explicit-any
    const pluginsList: any = {};

    // Enable from cli flags
    if (opts.github) pluginsList.github = github;
    if (opts.changelog) pluginsList.changelog = changelog;
    if (opts.regex) {
      pluginsList.regex = regex;
      const regs = opts.regex?.map((s) => {
        const cf = s.split(":::");
        if (cf.length === 1) {
          // assume it is readme
          return {
            file: "README.md",
            patterns: [cf[0]],
          };
        } else {
          return {
            file: cf[0],
            patterns: [cf[1]],
          };
        }
      });
      // deno-lint-ignore no-explicit-any
      (config as any).regex = regs;
    }
    if (opts.versionFile) pluginsList.versionFile = versionFile;

    // Enable Plugins from config
    for (const [key, val] of Object.entries(config)) {
      if (key === "options") continue;
      if (key === "github" && !pluginsList.github) pluginsList.github = github;
      else if (key === "changelog" && !pluginsList.changelog) {
        pluginsList.changelog = changelog;
      } else if (key === "regex") pluginsList.regex = regex;
      else if (key === "versionFile" && !pluginsList.versionFile) {
        pluginsList.versionFile = versionFile;
      } else {
        const def = val as { path: string };
        if (!def.path) throw Error(`Invalid config entry ${key}, ${val}`);
        const remotePlugin = await import(def.path);
        pluginsList.key = remotePlugin.default;
      }
    }

    // deno-lint-ignore no-explicit-any
    const plugins: ReleasePlugin<any>[] = Object.values(pluginsList);

    log.debug(`plugins loaded: ${plugins.map((p) => p.name).join(", ")}`);

    // Setup Plugins
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
    const fetch = step("Loading project info").start();
    let repo: Repo;
    try {
      repo = await fetchRepo(Deno.cwd());
    } catch (err) {
      console.log(err);
      fetch.fail();
      log.critical(err.message);
      Deno.exit(1);
    }
    fetch.succeed("Project loaded correctly");

    const [latest] = repo.tags;
    const from = latest ? latest.version : "0.0.0";
    const to = semver.increment(semver.parse(from), release_type, suffix);

    const integrity = step("Checking the project").start();
    await delay(1000);
    if (repo.status.raw.length !== 0) {
      if (opts.allowUncommitted) {
        console.log(
          "Uncommitted changes on your repository - allowUncommitted is true passing... ",
        );
      } else {
        integrity.fail("Uncommitted changes on your repository!");
        Deno.exit(1);
      }
    } else if (!repo.commits.some((_) => _.belongs === null)) {
      integrity.fail("No changes since the last release!");
      Deno.exit(1);
    }
    integrity.succeed("Project check successful");

    // Precommit
    for (const plugin of plugins) {
      if (!plugin.preCommit) continue;
      try {
        log.debug(`Executing preCommit ${plugin.name}`);
        await plugin.preCommit(
          repo,
          release_type,
          from,
          semver.format(to),
          config,
          log,
        );
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

    const bump = step(
      `Releasing ${colors.bold(semver.format(to))} ${
        colors.dim(`(latest was ${from})`)
      }`,
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
        bump.fail(`Unable to release ${colors.bold(semver.format(to))}\n`);
        log.critical(err.message);
        Deno.exit(1);
      }
      bump.succeed(`Released ${colors.bold(semver.format(to))}!`);
    } else {
      bump.warn(
        `Skipping release ${colors.bold(semver.format(to))} ${
          colors.dim(
            `(latest was ${from})`,
          )
        }`,
      );
    }

    for (const plugin of plugins) {
      if (!plugin.postCommit) continue;
      try {
        log.debug(`Executing postCommit ${plugin.name}`);
        await plugin.postCommit(
          repo,
          release_type,
          from,
          semver.format(to),
          config,
          log,
        );
      } catch (err) {
        log.critical(err.message);
        Deno.exit(1);
      }
    }
  })
  .parse(Deno.args);
