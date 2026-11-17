const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const current = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

function log(level, data, msg) {
  if (LEVELS[level] < current) return;
  const entry = {
    time: new Date().toISOString(),
    level,
    msg: typeof data === "string" ? data : msg,
    ...(typeof data === "object" ? data : {}),
  };
  const output = JSON.stringify(entry);
  if (level === "error") {
    process.stderr.write(output + "\n");
  } else {
    process.stdout.write(output + "\n");
  }
}

export const logger = {
  debug: (data, msg) => log("debug", data, msg),
  info: (data, msg) => log("info", data, msg),
  warn: (data, msg) => log("warn", data, msg),
  error: (data, msg) => log("error", data, msg),
};
