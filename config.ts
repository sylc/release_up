import type { ReleasePlugin } from "./plugin.ts";

export interface ReleaseConfig {
  plugins: ReleasePlugin[];
  dry: boolean;
  allowUncommitted: boolean
}
