import { LocalObjectStorage } from "./local-object-storage";
import { createS3Client, S3ObjectStorage } from "./s3-object-storage";
import type { ObjectStorage } from "./object-storage";

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new StorageConfigurationError(`Missing storage environment variable: ${name}`);
  return value;
}

export function getObjectStorage(): ObjectStorage {
  const provider = process.env.STORAGE_PROVIDER?.trim().toLowerCase() || "local";
  if (provider === "local") {
    return new LocalObjectStorage(process.env.STORAGE_LOCAL_DIR?.trim() || ".data");
  }
  if (provider === "s3") {
    const endpoint = process.env.S3_ENDPOINT?.trim();
    const accessKeyId = required("S3_ACCESS_KEY_ID");
    const secretAccessKey = required("S3_SECRET_ACCESS_KEY");
    return new S3ObjectStorage({
      bucket: required("S3_BUCKET"),
      client: createS3Client({
        region: process.env.S3_REGION?.trim() || "auto",
        ...(endpoint ? { endpoint } : {}),
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: { accessKeyId, secretAccessKey },
      }),
    });
  }
  throw new StorageConfigurationError(`Unsupported storage provider: ${provider}`);
}
