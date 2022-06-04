# release_up

A fork of [release](https://github.com/denosaurs/release) by
[denosaurs](https://github.com/denosaurs)

## Installation

```
$ deno install -A -f --no-check -n release_up https://deno.land/x/release_up@0.2.4/cli.ts
```

## Usage

```
usage: release_up [options] <type> [...]

example: release_up major

[options]:
  -h --help          Show this message
  --dry              Prevent changes to git
  --allowUncommited  Allow some changes to be uncommited

[type]:
  release type:
    * patch             eg: 1.2.3 -> 1.2.4
    * minor             eg: 1.2.3 -> 1.3.0
    * major             eg: 1.2.3 -> 2.0.0
    * prepatch <name>   eg: 1.2.3 -> 1.2.4-name
    * preminor <name>   eg: 1.2.3 -> 1.2.4-name
    * premajor <name>   eg: 1.2.3 -> 1.2.4-name
```

## Plugins

release_up supports local and remote plugins. By default, plugins are **NOT**
enabled. To enable them, create a `.release_up.json` file that has a key
matching the plugin. Example of configuration.

```json
// .release_up.json
{
  "changelog": {},
  "github": {
    "release": true
  },
  "regex": {
    "patterns": [
      "/(?<=@)(.*)(?=\/)/gm",
      "(?<=release_up\/)(.*)(?=\/cli)"
    ]
  },
  "versionFile": {},
  "myRemotePlugin": {
    "path": "./plugins/testRemote/mod.ts"
  }
}
```

### Baked-in plugins

- [github](./doc/doc.md#github): Create a release on Github.
- [changelog](./doc/doc.md#changelog): Create a changelog based on filtered
  commits.
- [regex](./doc/doc.md#changelog): Apply a regex on `README.md`
- [versionFile](./plugins/versionFile/mod.ts): Create a `version.json` file with
  the new version number.

### Remote plugins

Plugins can also be defined externally. In that case they must have a "path"
property in their config. The path can be either a local path or http(s) path.

A plugin must contain a default export with the signature defined at
[./plugins.ts](/plugins.ts)

## Secrets

release_up uses dotenv to load environment variables. For example for
interactiong with Github, set a `.env` file with the below

```
GITHUB_TOKEN=<my secret token>
```

## Credits

Big Credits to [denosaurs](https://github.com/denosaurs). This project is a fork
of [release](https://github.com/denosaurs/release). The current core features
have been implemented by it.

### Inspiration

this project is inspired by node project
[release-it](https://github.com/release-it/release-it)

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with
deno fmt.
