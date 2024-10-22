export type FileModel = {
  id: string;
  name: string;
  visibility: "public" | "private";
  path: string;
};

export type FileResponse = {
  id: string;
  mime: string;
  name: string;
};

export type OsType = "linux" | "windows" | "macos" | "ios" | "android";
export type Peer = {
  address: string;
  osType: OsType;
};
