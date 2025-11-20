import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getBucketDomain = () => `https://${requireEnv("R2_BUCKET")}.r2.dev`;

export const getPublicBaseUrl = () => {
  const configured = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }
  return stripTrailingSlash(getBucketDomain());
};

const getObjectKeyFromUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = [getPublicBaseUrl(), stripTrailingSlash(getBucketDomain())];

  for (const base of candidates) {
    if (trimmed.startsWith(base)) {
      const remainder = trimmed.slice(base.length).replace(/^\/+/, "");
      if (remainder) {
        return remainder;
      }
    }
  }

  try {
    const parsed = new URL(trimmed);
    const maybeKey = parsed.pathname.replace(/^\/+/, "");
    return maybeKey || null;
  } catch {
    return null;
  }
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

  const publicBase = getPublicBaseUrl();
  const normalizedKey = objectKey.replace(/^\/+/, "");

  return `${publicBase}/${normalizedKey}`;
};

export const deleteObjectByKey = async (objectKey: string) => {
  const bucket = requireEnv("R2_BUCKET");
  const client = getClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
};

export const deleteObjectsForUrls = async (urls: string[]) => {
  const keys = urls
    .map((url) => getObjectKeyFromUrl(url))
    .filter((key): key is string => Boolean(key));

  if (!keys.length) {
    return;
  }

  await Promise.all(keys.map((key) => deleteObjectByKey(key)));
};

export const readObjectAsText = async (
  objectKey: string,
): Promise<string | null> => {
  const bucket = requireEnv("R2_BUCKET");
  const client = getClient();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      }),
    );

    const body = response.Body;
    if (!body) {
      return null;
    }

    const text = await body.transformToString();
    return text;
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return null;
    }
    if ((error as { Code?: string }).Code === "NoSuchKey") {
      return null;
    }
    throw error;
  }
};

export const writeTextObject = async (objectKey: string, body: string) => {
  const bucket = requireEnv("R2_BUCKET");
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: "application/json",
    }),
  );
};
