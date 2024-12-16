import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { generatePresignedUrl, finalizeUpload, listImagesFromS3 } from "@/lib/storage/s3";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const mediaRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string().refine(
        type => ALLOWED_FILE_TYPES.includes(type),
        `File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`
      ),
      fileSize: z.number().max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
    }))
    .mutation(async ({ input }) => {
      const { url, key } = await generatePresignedUrl({
        filename: input.filename,
        contentType: input.contentType,
      });
      
      return { url, key };
    }),

  finalizeUpload: protectedProcedure
    .input(z.object({
      key: z.string(),
    }))
    .mutation(async ({ input }) => {
      const imageUrl = await finalizeUpload(input.key);
      return { imageUrl };
    }),

  listImages: protectedProcedure
    .query(async () => {
      const images = await listImagesFromS3();
      return images;
    }),
}); 