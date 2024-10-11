[![JSR](https://jsr.io/badges/@sylc/release_up)](https://jsr.io/@sylc/release_up)

<h1 align="center">
  🌱 release_up
</h1>

<p align="center">
  <b>Automate semver releases in Deno 🦕</b>
</p>

# Motivation

This projects allows to perform automatically tasks required at release time
like for example:

- Updating version numbers in the readme, according to the new tag.
- Updating links in readme.
- Creating a changelog.
- Creating a new tag based on existing ones
- Pushing a release to github.

Most changes are optionals and configurable.

# Installation

```
deno install --global --force -A -n release_up jsr:@sylc/release-up
```

# Usage

```
  Usage:   release_up <release_type> [name]
  Version: 0.6.0  Description:

    Automate semver releases.
    Example: release_up major --github

    Release type:
      * patch             eg: 1.2.3 -> 1.2.4
      * minor             eg: 1.2.3 -> 1.3.0
      * major             eg: 1.2.3 -> 2.0.0
      * prepatch <name>   eg: 1.2.3 -> 1.2.4-name.0
      * preminor <name>   eg: 1.2.3 -> 1.3.0-name.0
      * premajor <name>   eg: 1.2.3 -> 2.0.0-name.0
      * prerelease <name> eg: 1.2.3-name.0 -> 1.2.3-name.1

  Options:

    -h, --help                          - Show this help.
    -V, --version                       - Show the version number for this program.
    --config            <confi_path>    - Define the path of the config. (Default: ".release_up.json")
    --github                            - Enable Github plugin.
    --changelog                         - Enable Changelog plugin.
    --versionFile                       - Enable VersionFile plugin.
    --regex             <pattern>       - Enable Regex plugin. The regex need to be provided as string.
    --dry                               - Dry run, Does not commit any changes.
    --allowUncommitted                  - Allow uncommited change in the repo.
    --debug                             - Enable debug logging.
```

# Plugins

release_up supports local and remote plugins. By default, plugins are **NOT**
enabled. To enable them, either

- Use a cli flag
- Create a `.release_up.json` file that has a key matching the plugin. Example
  of configuration.

```json
// .release_up.json
{
  "changelog": {},
  "github": {
    "release": true
  },
  "regex": [
    {
      "file": "README.md",
      "patterns": [
        "(?<=@)(.*)(?=\/cli)"
      ]
    },
    {
      "file": "deno.json",
      "patterns": [
        "(?<=\"version\": \")(.*)(?=\",)"
      ]
    }
  ],
  "versionFile": {},
  "myRemotePlugin": {
    "path": "./plugins/testRemote/mod.ts"
  }
}
```

## Baked-in plugins

- [github](./doc/doc.md#github): Create a release on Github.
- [changelog](./doc/doc.md#changelog): Create a changelog based on filtered
  commits.
- [regex](./doc/doc.md#changelog): Apply a regex on `README.md`
- [versionFile](./plugins/versionFile/mod.ts): Create a `version.json` file with
  the new version number.

## Remote plugins

Plugins can also be defined externally. In that case they must have a "path"
property in their config. The path can be either a local path or http(s) path.

A plugin must contain a default export with the signature defined at
[./plugins.ts](/plugins.ts)

# Secrets

release_up uses dotenv to load environment variables. For example for
interactiong with Github, set a `.env` file with the below

```
GITHUB_TOKEN=<my secret token>
```

# Examples

- [Github Actions worflow](.github/workflows/release.yml)

# Credits

Big Credits to [denosaurs](https://github.com/denosaurs). This project is a fork
of [release](https://github.com/denosaurs/release). The current core features
have been implemented by it.

## Inspiration

This project is inspired by node project
[release-it](https://github.com/release-it/release-it)

## Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with
deno fmt.

## LICENSE

MIT
