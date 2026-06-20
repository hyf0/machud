import { execFile } from "node:child_process";

// Run a command and resolve its stdout. On any failure (non-zero exit, timeout,
// missing binary) we resolve "" instead of rejecting, so a collector that calls
// sh() can parse an empty string and fall back to safe defaults. This is the
// backbone of machud's "never crash, just degrade" behavior.
export function sh(cmd: string, args: string[] = [], timeoutMs = 4000): Promise<string> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      if (err && !stdout) {
        resolve("");
        return;
      }
      resolve(stdout ?? "");
    });
  });
}
