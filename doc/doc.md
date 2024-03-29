# Changelog

Changelog creates a file called `CHANGELOG.md`. Only commits starting with
`feat` and `fix` and `breaking` will be showing up

# Github

The github plugin create github release. Releases can be created as `draft`

Only commits starting with `feat` and `fix` and `breaking` will appear in the
release change log

```ts
interface GithubConfig {
  github: {
    /**
     * Perform a release. Can also be set to 'draft' to perform a draft release
     * default is true
     */
    release?: boolean | "draft";
  };
}
```

# Regex

Apply a regex on the `README.md` or any other files with the new version or any
other value. The regex can be configured in the config file. e.g:

```json
"regex": {
    "patterns": [
      "/(?<=@)(.*)(?=\/)/gm",
      "(?<=release_up\/)(.*)(?=\/cli)"
    ]
  },
```
