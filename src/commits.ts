import { git } from "./git.ts";
import type { Tag } from "./tags.ts";
import { ReleaseError } from "./error.ts";

export interface RawCommit {
  hash: string;
  title: string;
  description: string;
  author: string;
  cc: {
    /** the description part of the title */
    header: string | null;
    type?: string | null;
  };
}

export async function fetchRawCommits(
  repo: string,
  rev?: string,
): Promise<RawCommit[]> {
  const inner = Date.now();
  const outer = inner - 1;

  // How the output shoud look like
  const spec = ["s", "n", "ae", "b"]; // add at
  const format = `${inner} %${spec.join(`${inner}%`)}${outer}`;

  const [success, output, err] = await git(repo, [
    "rev-list",
    `--pretty=format:${format}`,
    "--header",
    rev ?? "HEAD",
  ]);
  if (!success) throw new ReleaseError("GIT_EXE", err);

  let commits: RawCommit[] = [];
  const parts = output
    .split(String(outer))
    .map((item) => item.trim())
    .filter((item) => item.length)
    .map((item) => {
      const splitted = item.split(String(inner));
      const details = splitted.map((i) => i.trim()).filter((i) => i);
      const hash = details[0].split(" ")[1];
      const title = details[1] || "";
      const description = details[3] || "";
      const author = details[2];

      const parsed = parseCommit(title)
      const cc = parsed
      
      return {
        hash,
        title,
        description,
        author,
        cc,
      };
    })
    .filter((i) => i);

  commits = commits.concat(parts);
  return commits;
}

export interface Commit extends RawCommit {
  belongs: Tag | null;
}

export async function fetchCommits(
  repo: string,
  tags: Tag[],
): Promise<Commit[]> {
  let all: Commit[] = [];

  async function add(rev: string | undefined, belongs: Tag | null) {
    const commits = await fetchRawCommits(repo, rev);
    all = all.concat(
      commits.map((_) => ({
        ..._,
        belongs,
      })),
    );
  }

  if (tags.length === 0) {
    await add(undefined, null);
    return all;
  }

  let child = tags[0];
  let parent = tags[0];

  if (child) {
    await add(`${child.hash}..HEAD`, null);
  }

  for (let i = 0; i < tags.length - 1; i++) {
    child = tags[i];
    parent = tags[i + 1];
    await add(`${parent.hash}..${child.hash}`, child);
  }

  if (parent) {
    await add(parent.hash, parent);
  }

  return all;
}

export function parseCommit(title: string){
  const titlePattern = new RegExp(/^(\w*)(?:\(([\w\$\.\-\* ]*)\))?(?:\:|!\:) (.*)$/)
  
  // Regex groups are: 
  // const groups = [
  //   "type",
  //   "scope",
  //   "description"
  // ]
  
  const matches = title.match(titlePattern)
  const res: { header: string; type: string | null } = {
    header: title,
    type: null
  }
  if (matches) {
    res.header = matches[3]
    res.type = matches[1]
  }
  return res
}