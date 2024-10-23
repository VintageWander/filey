import { OsType } from "./models";

export const capitalLetter = (str: string): string => {
  return str[0].toUpperCase() + str.slice(1);
};

export const printLocalMachineName = (host: OsType, existsBattery: boolean) => {
  return `This ${
    host === "macos" || host === "windows" || host === "linux"
      ? existsBattery
        ? " laptop"
        : " desktop"
      : host === "android" || host === "ios"
      ? " phone"
      : " unknown device"
  }`;
};
