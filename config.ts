// import type { ReleasePlugin } from "./plugin.ts";

export interface ReleaseConfig {
  options: {
    dry: boolean;
    allowUncommitted: boolean;
  }
}
