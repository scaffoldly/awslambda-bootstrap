#!/usr/bin/env node

const log = (title, obj) => {
  if (!obj) {
    console.log(title);
    return;
  }
  console.log(`  ${title}\n`, `  ==> ${JSON.stringify(obj)}`);
};

log("Process Info:");
log("pid: ", process.pid);
log("title: ", process.title);
log("arch: ", process.arch);
log("platform: ", process.platform);
log("env: ", process.env);
log("version: ", process.version);
log("versions: ", process.versions);
log("features: ", process.features);
log("release: ", process.release);
log("argv: ", process.argv);
log("execArgv: ", process.execArgv);
log("execPath: ", process.execPath);
log("cwd: ", process.cwd());
