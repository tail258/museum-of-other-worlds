import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

import { assertStorageKey, inferContentType, type ObjectStorage } from "./object-storage";

type S3ObjectStorageConfig = {
  bucket: string;
  client: S3Client;
};

export class S3ObjectStorage implements ObjectStorage {
  constructor(private readonly config: S3ObjectStorageConfig) {}

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    assertStorageKey(key);
    await this.config.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
  }

  async get(key: string) {
    assertStorageKey(key);
    try {
      const response = await this.config.client.send(new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }));
      if (!response.Body) return null;
      return {
        body: await response.Body.transformToByteArray(),
        contentType: response.ContentType ?? inferContentType(key),
      };
    } catch (caught) {
      const error = caught as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) return null;
      throw caught;
    }
  }
}

export function createS3Client(config: S3ClientConfig) {
  return new S3Client(config);
}
