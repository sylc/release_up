# release-me


## Installation

```
$ deno install -A -f --unstable ...
```

## Usage

```
usage: release-me [options] <type> [...]

example: release-me major

[options]:
  -h --help     Show this message
  --dry         Prevent changes to git

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

Big Credits to https://github.com/denosaurs. This project is mainly based on https://github.com/denosaurs/release, where I have done some minor refacatoring.
However due to the lack of development on the original package, I have done some update to suit my needs

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with
deno fmt and commit messages are done following Conventional Commits spec.
