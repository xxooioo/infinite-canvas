import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const services = [
    { name: "画布", directory: "web", entry: "node_modules/vite/bin/vite.js", args: ["--host", "0.0.0.0", "--port", "3000"] },
    { name: "Agent", directory: "canvas-agent", entry: "node_modules/tsx/dist/loader.mjs", args: [] },
];

for (const service of services) {
    if (!existsSync(`${root}${service.directory}/${service.entry}`)) {
        console.error(`${service.name} 缺少依赖，请先在 ${service.directory}/ 安装依赖；启动脚本不会自动下载。`);
        process.exit(1);
    }
}
const codex = process.env.CANVAS_CODEX_PATH || "codex";
if (spawnSync(codex, ["--version"], { stdio: "ignore" }).status !== 0) {
    console.error("无法运行本机 Codex CLI，请检查 PATH 或设置 CANVAS_CODEX_PATH。不会下载 Codex 副本。");
    process.exit(1);
}

const children = [];
const processGroups = process.platform !== "win32";
let stopping = false;
function stop(code) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of children) {
        if (!child.pid) continue;
        try {
            if (processGroups) process.kill(-child.pid, "SIGTERM");
            else child.kill("SIGTERM");
        } catch (error) {
            if (error.code !== "ESRCH") console.error(error.message);
        }
    }
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

console.log("正在启动画布和本地 Agent；按 Ctrl+C 一起停止。本机 Codex：", codex);
for (const service of services) {
    const args = service.name === "Agent" ? ["--import", "tsx", "src/index.ts"] : [service.entry, ...service.args];
    const child = spawn(process.execPath, args, { cwd: `${root}${service.directory}`, stdio: "inherit", detached: processGroups });
    children.push(child);
    child.on("error", (error) => { console.error(`${service.name} 启动失败：${error.message}`); stop(1); });
    child.on("exit", (code) => { if (!stopping) console.error(`${service.name} 已退出，停止另一服务。`); stop(code ?? 1); });
}
