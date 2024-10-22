import { FaAndroid, FaApple, FaLinux, FaWindows } from "react-icons/fa";
import { MdDeviceUnknown } from "react-icons/md";
import { OsType } from "@/models";

export const OsIcon = ({ os }: { os: OsType }) =>
  os === "android" ? (
    <FaAndroid />
  ) : os === "ios" || os === "macos" ? (
    <FaApple />
  ) : os === "linux" ? (
    <FaLinux />
  ) : os === "windows" ? (
    <FaWindows />
  ) : (
    <MdDeviceUnknown />
  );
