import packageJson from "../package.json";

export const log = (message: any, obj?: Record<string, any>): void => {
  if (!process.env.SLY_DEBUG) return;
  console.log(
    `[${packageJson.name}@${packageJson.version}] ${message}`,
    JSON.stringify(obj)
  );
};
