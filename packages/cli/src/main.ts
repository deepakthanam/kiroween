import { packageName } from "./index";

const [command] = process.argv.slice(2);

if (command === undefined || command === "--help" || command === "-h") {
  console.log(`${packageName}: no commands yet. Phase 0 placeholder.`);
  process.exit(0);
}

console.error(`Unknown command: ${command}`);
process.exit(1);
