// import type { ReleasePlugin } from "./plugin.ts";

interface CliConfig {
  options: {
    dry?: boolean;
    allowUncommitted?: boolean;
  }
}

export type ReleaseConfig<T> = T & CliConfig
