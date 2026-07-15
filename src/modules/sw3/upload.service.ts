import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../lib/s3.js";


export async function uploadFile(
    file: Express.Multer.File,
    patientId: string
){

    const key = `patients/${patientId}/${Date.now()}-${file.originalname}`;


    await s3Client.send(
        new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        })
    );


    return key;
}
