import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../lib/s3.js";
import { env } from "../../config/env.js";

export async function uploadFile(file: Express.Multer.File, patientId: string): Promise<string> {
  const key = `patients/${patientId}/${Date.now()}-${file.originalname}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.awsBucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://${env.awsBucketName}.s3.${env.awsRegion}.amazonaws.com/${key}`;
}
