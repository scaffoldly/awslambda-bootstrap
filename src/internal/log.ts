import packageJson from "../../package.json";

export const info = (message: any, obj?: Record<string, any>): void => {
  console.log(
    `[${packageJson.name}@${packageJson.version}] ${message}`,
    obj ? JSON.stringify(obj) : undefined
  );
};

export const log = (message: any, obj?: Record<string, any>): void => {
  if (!process.env.SLY_DEBUG) return;
  console.log(
    `[${packageJson.name}@${packageJson.version}] ${message}`,
    obj ? JSON.stringify(obj) : undefined
  );
};
