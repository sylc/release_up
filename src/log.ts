import { log } from "../deps.ts";

export async function initLogger(useDebug?: boolean) {
  await log.setup({
    handlers: {
      console: new log.ConsoleHandler(useDebug ? "DEBUG" : "INFO"),
    },
    loggers: {
      // configure default logger available via short-hand methods above.
      default: {
        level: useDebug ? "DEBUG" : "INFO",
        handlers: ["console"],
      },
    },
  });
}
