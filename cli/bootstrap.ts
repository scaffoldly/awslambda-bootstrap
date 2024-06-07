import { log } from "../src/internal/log";
import packageJson from "../package.json";
import { run } from "../src";

(async () => {
  if (process.argv.includes("--version")) {
    console.log(packageJson.version);
    return;
  }

  log("Starting bootstrap", { env: JSON.stringify(process.env) });

  try {
    await run();
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
    process.exit(1);
  }

  log("Bootstrap complete");
})();
