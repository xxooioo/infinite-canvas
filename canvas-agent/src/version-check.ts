import { execFileSync } from "node:child_process";

import { VERSION } from "./config.js";
import { logger } from "./utils/logger.js";

/** 只检查本机 CLI，不下载运行时或查询远程版本。 */
export function checkVersions() {
    const executable = process.env.CANVAS_CODEX_PATH || "codex";
    logger.info("Canvas Agent version", { version: VERSION });
    try {
        const version = execFileSync(executable, ["--version"], { encoding: "utf8", timeout: 5_000 }).trim();
        logger.info("Local Codex", { executable, version });
    } catch {
        logger.warn("无法运行本机 Codex CLI，请检查 PATH 或设置 CANVAS_CODEX_PATH 为已有 codex 的绝对路径；不会自动下载 Codex。");
    }
}
