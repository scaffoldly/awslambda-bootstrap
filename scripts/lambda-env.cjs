#!/usr/bin/env node

const env = {
  pid: process.pid,
  title: process.title,
  arch: process.arch,
  platform: process.platform,
  env: process.env,
  version: process.version,
  versions: process.versions,
  features: process.features,
  release: process.release,
  argv: process.argv,
  execArgv: process.execArgv,
  execPath: process.execPath,
  cwd: process.cwd(),
};

console.error(`Lambda Environment:\n`, JSON.stringify(env, null, 2));

if (process.env.AWS_LAMBDA_RUNTIME_API) {
  console.log(
    JSON.stringify(
      {
        statusCode: 200,
        body: JSON.stringify(env, null, 2),
      },
      null,
      2
    )
  );
}
