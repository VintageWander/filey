import { useAtom } from "jotai";
import { hostOsAtom } from "./store";

export const capitalLetter = (str: string): string => {
  return str[0].toUpperCase() + str.slice(1);
};

export const printLocalMachineName = (existsBattery: boolean) => {
  const [host] = useAtom(hostOsAtom);
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
