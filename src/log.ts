import { log } from "../deps.ts";

export function initLogger(useDebug?: boolean) {
  log.setup({
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
