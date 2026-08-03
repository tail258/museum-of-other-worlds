import type { z } from "zod";

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export type IdentifyInput = {
  image: Uint8Array;
  mediaType: SupportedImageType;
  worldview: string;
  demoId?: string;
};

export type RepairContext = {
  rawResponse: unknown;
  issues: z.core.$ZodIssue[];
};

export interface AIProvider {
  identify(input: IdentifyInput, repair?: RepairContext): Promise<unknown>;
}
