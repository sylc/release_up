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
     * Perform a release. Can also be set to 'draft' to performa draft release
     */
    release?: boolean | "draft";
  };
}
```

# Regex

Apply a regex on the `README.md`. The regex can be configure in the config file.
e.g:

```json
"regex": {
    "patterns": [
      "/(?<=@)(.*)(?=\/)/gm",
      "(?<=release_up\/)(.*)(?=\/cli)"
    ]
  },
```
