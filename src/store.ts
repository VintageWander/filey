import { atom } from "jotai";
import { FileModel } from "./models";

// File list
export const filesAtom = atom<FileModel[]>([]);

// Server config related store
export const connectedToAtom = atom<string>("This machine");
export const serverStatusAtom = atom<"online" | "offline">("offline");
export const localIpsAtom = atom<string[]>([]);
