# release-me

A fork of [release](https://github.com/denosaurs/release)

## Installation

```
$ deno install -A -f --no-check -n release-me -r https://raw.githubusercontent.com/sylc/release-me/main/cli.ts
```

## Usage

```
usage: release-me [options] <type> [...]

example: release-me major

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

## Credits

Big Credits to https://github.com/denosaurs. This project is a fork of
https://github.com/denosaurs/release. However due to the lack of development on
the original package, I have done some update.

## Plugins

Release-me supports plugins. the current ones are

- [changelog](./plugin/changelog/mod.ts): Create a changelog
- github: Create a release on Github
- regex: Apply a regex on the Readme to update the version number
- versionFile: Create a file with the new version

To develop new plugins, refer to [./plugins.ts](/plugins.ts)

## Secrets

Release-me uses dotenv to load environment variables

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with
deno fmt and commit messages are done following Conventional Commits spec.
