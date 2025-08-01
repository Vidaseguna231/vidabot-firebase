
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GCP_PROJECT_ID; 

if (!PROJECT_ID) {
    console.warn("GCP_PROJECT_ID environment variable not set. Using fallback for local development. This should be set in production.");
}

async function accessSecret(secretName) {
  // Fallback for local development if GCP_PROJECT_ID is not set.
  // In Cloud Run, GCP_PROJECT_ID will be available.
  if (!PROJECT_ID) {
      console.log(`Local mode: Using placeholder for secret '${secretName}'`);
      if (secretName === 'VIDA_ADMIN_KEY') return 'aB7!kP9#sZ3@fR6$wQ2^uX1&yM8*eT4';
      if (secretName === 'JWT_SECRET') return 'local-super-secret-key-for-jwt';
      if (secretName === 'GEMINI_API_KEY') return process.env.API_KEY; // For local dev, get from .env
      return '';
  }

  try {
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });

    if (!version.payload || !version.payload.data) {
      throw new Error(`Could not access secret: ${secretName}`);
    }
    return version.payload.data.toString();
  } catch(error) {
    console.error(`Failed to access secret ${secretName}. Ensure it exists in Secret Manager and the service account has permissions.`, error);
    process.exit(1);
  }
}

// Load all secrets at startup
export const secrets = {
  geminiApiKey: await accessSecret('GEMINI_API_KEY'),
  vidaAdminKey: await accessSecret('VIDA_ADMIN_KEY'),
  jwtSecret: await accessSecret('JWT_SECRET'),
};
