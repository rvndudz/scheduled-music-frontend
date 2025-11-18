import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type RequiredEnv =
  | "R2_ACCESS_KEY"
  | "R2_SECRET_KEY"
  | "R2_BUCKET"
  | "R2_ENDPOINT";

const requireEnv = (key: RequiredEnv): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

let cachedClient: S3Client | null = null;

const getClient = (): S3Client => {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY"),
      secretAccessKey: requireEnv("R2_SECRET_KEY"),
    },
    forcePathStyle: true,
  });

  return cachedClient;
};

interface UploadParams {
  objectKey: string;
  body: Buffer | Uint8Array;
  contentType?: string;
}

export const uploadFileToR2 = async ({
  objectKey,
  body,
  contentType,
}: UploadParams): Promise<string> => {
  const bucket = requireEnv("R2_BUCKET");
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType ?? "audio/mpeg",
    }),
  );

  return `https://${bucket}.r2.dev/${objectKey}`;
};
