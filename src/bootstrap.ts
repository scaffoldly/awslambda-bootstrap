import { log } from "./internal/log";
import packageJson from "../package.json";
import { run } from ".";

(async () => {
  if (process.argv.includes("--version")) {
    console.log(packageJson.version);
    return;
  }

  log("Starting bootstrap", { env: JSON.stringify(process.env) });

  try {
    await run();
  } catch (e) {
    log("Bootstrap failed", { error: e });

    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
    process.exit(1);
  }

  log("Bootstrap complete");
})();
