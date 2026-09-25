import makeWASocket from './Socket/index.js';
import chalk from "chalk";
import { enableCallAutoAnswer, getActiveVoipClient, CallState } from './Caller/auto-answer.js';
import { attachProMethods } from './Pro/index.js';

// === BANNER ASCII SMD — ishu-md ===
console.log(chalk.hex("#FFC72C")("     ╦  ╦┌─┐┬ ┬┌─┐┬┌─ "));
console.log(chalk.hex("#FF9933")("     │  ││ │││││  ├┴┐ "));
console.log(chalk.hex("#FF7A00")("     └─┘└─┘└┴┘└─┘┴ ┴ "));

// === INFO ===
const smdLine = chalk.hex("#FFC72C")("─────────────────────────────────────────────");
console.log("\n" + smdLine);
console.log(
  chalk.hex("#FFC72C")("  🦁 ") +
  chalk.hex("#FF7A00").bold("AYSU") +
  chalk.gray("  •  ") +
  chalk.hex("#FFC72C").bold("By Lovely") +
  chalk.hex("#FF7A00")("")
);
console.log(chalk.gray("  📦  npm     ") + chalk.hex("#FFC72C")("ishumdz-bail"));
console.log(chalk.gray("  🌐  web     ") + chalk.hex("#FFC72C")("ishanx-pro.site.je"));
console.log(chalk.gray("  💬  channel ") + chalk.hex("#FFC72C")("web-api"));
console.log(smdLine);
console.log(chalk.hex("#FF7A00").bold("  ✓  ") + chalk.greenBright("Baileys Connected — Online") + "\n");
// === EXPORTS ===
export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export * from './Store/index.js';
export * from './Socket/ban-checker.js';
export * from './Games/index.js';
export * from './Caller/index.mjs';
export * from './Pro/index.js';
export { enableCallAutoAnswer, getActiveVoipClient, CallState, attachProMethods, makeWASocket };
export default makeWASocket;
//# sourceMappingURL=index.js.map
