import { atom } from "jotai";
import { FileModel } from "./models";

// File list
export const filesAtom = atom<FileModel[]>([]);

// Server config related store
export const connectedToAtom = atom<string>("This machine");
export const isLocalAtom = atom<boolean>(
  (get) => get(connectedToAtom) === "This machine"
);
export const serverStatusAtom = atom<"online" | "offline">("offline");
export const isOnlineAtom = atom<boolean>(
  (get) => get(serverStatusAtom) === "online"
);
export const localIpsAtom = atom<string[]>([]);
