import packageJson from "../package.json";

export const log = (message?: any, ...optionalParams: any[]): void => {
  if (!process.env.SLY_DEBUG) return;
  console.log(
    `[${packageJson.name}@${packageJson.version}] ${message}`,
    optionalParams
  );
};
