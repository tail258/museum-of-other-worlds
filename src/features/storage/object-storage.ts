export type StoredObject = {
  body: Uint8Array;
  contentType: string;
};

export interface ObjectStorage {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
}

export function assertStorageKey(key: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(key) || key.includes("..") || key.includes("//")) {
    throw new Error("Invalid storage key");
  }
}

export function inferContentType(key: string) {
  if (key.endsWith(".json")) return "application/json";
  if (key.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}
