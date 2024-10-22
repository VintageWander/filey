import { atom } from "jotai";
import { FileModel } from "./models";

export const filesAtom = atom<FileModel[]>([]);

export const connectedToAtom = atom<string>("This machine");
