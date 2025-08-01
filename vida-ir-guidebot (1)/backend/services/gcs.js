
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'vida-ir-guidebot-uploads';

export async function generateV4UploadSignedUrl(fileName, contentType) {
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  };

  const [url] = await storage
    .bucket(BUCKET_NAME)
    .file(fileName)
    .getSignedUrl(options);
  
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;

  return { signedUrl: url, publicUrl };
}
