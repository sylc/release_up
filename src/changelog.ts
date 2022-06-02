import type { Repo } from "./repo.ts";
import type { Commit } from "./commits.ts";
import type { Tag } from "./tags.ts";

export interface Filter {
  type: string;
  title: string;
}

export interface Document {
  sections: string[];
  links: string[];
}

// links definition for markdown (they are not inline)
export function fmtLink(name: string, to: string): string {
  return `[${name}]: ${to}`;
}

export function pushHeader(doc: Document): void {
  doc.sections.push(`# Changelog

All notable changes to this project will be documented in this file.`);
}

export function pushChanges(
  doc: Document,
  repo: Repo,
  title: string,
  commits: Commit[],
  style: "github" | "md",
): void {
  doc.sections.push(`### ${title}`);
  const list: string[] = [];
  for (const commit of commits) {
    const { hash } = commit;
    const { header } = commit.cc;
    const shortid = `\`${hash.slice(0, 7)}\``;

    if (repo.remote && repo.remote.github && style === "md") {
      const { user, name } = repo.remote.github;
      let url = `https://github.com/${user}/${name}/`;
      url = `${url}commit/${hash}`;

      list.push(`- ${header} ([${shortid}])`);
      doc.links.push(fmtLink(shortid, url));
    } else {
      // on github release we do not need to use url
      list.push(`- ${header} (${shortid})`);
    }
  }
  doc.sections.push(list.join("\n"));
}

export function pushTag(
  doc: Document,
  repo: Repo,
  commits: Commit[],
  filters: Filter[],
  tag: Tag,
  style: "github" | "md",
  parent?: Tag,
): void {
  const year = tag.date.getUTCFullYear();
  const month = String(tag.date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tag.date.getUTCDate()).padStart(2, "0");

  if (repo.remote && repo.remote.github && style === "md") {
    const { user, name } = repo.remote.github;
    let url = `https://github.com/${user}/${name}/`;

    url = parent
      ? `${url}compare/${parent.version}...${tag.version}`
      : `${url}compare/${tag.version}`;
    doc.links.push(fmtLink(tag.version, url));
    doc.sections.push(`## [${tag.version}] - ${year}-${month}-${day}`);
  } else {
    doc.sections.push(`## ${tag.version} - ${year}-${month}-${day}`);
  }

  for (const filter of filters) {
    const filtered = commits.filter((_) => _.cc.type === filter.type);
    if (filtered.length > 0) {
      pushChanges(doc, repo, filter.title, filtered, style);
    }
  }
}

export function render(doc: Document): string {
  const sections = doc.sections.join("\n\n");
  const links = doc.links.join("\n");
  const full = [sections, links];
  return `${full.join("\n\n").trim()}\n`;
}

export function polyfillVersion(repo: Repo, to: string): [Tag[], Commit[]] {
  const newtag: Tag = {
    tag: to,
    version: to,
    date: new Date(),
    hash: "",
  };
  const tags = [newtag, ...repo.tags];
  const commits = [...repo.commits];

  for (const commit of commits) {
    if (commit.belongs !== null) break;
    commit.belongs = newtag;
  }

  return [tags, commits];
}
