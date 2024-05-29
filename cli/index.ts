import { log } from "src/log";
import packageJson from "../package.json";
import { bootstrap } from "../src/bootstrap";

(async () => {
  if (process.argv.includes("--version")) {
    console.log(packageJson.version);
    return;
  }

  log("Starting bootstrap");

  try {
    await bootstrap();
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
