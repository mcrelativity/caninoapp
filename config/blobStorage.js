if (!globalThis.crypto) {
  globalThis.crypto = require("node:crypto").webcrypto;
}

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} = require("@azure/storage-blob");

const SAS_EXPIRY_MINUTES = 10;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

let sharedKeyCredential;
let blobServiceClient;
let containerClient;

const requiredEnvVars = ["AZURE_STORAGE_ACCOUNT_NAME", "AZURE_STORAGE_ACCOUNT_KEY", "AZURE_STORAGE_CONTAINER_NAME"];

const isConfigured = () => requiredEnvVars.every((key) => Boolean(process.env[key]));

const initBlobService = () => {
  if (!isConfigured()) {
    const error = new Error(
      "Faltan variables de entorno de Azure Blob Storage (AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, AZURE_STORAGE_CONTAINER_NAME)."
    );
    error.status = 500;
    throw error;
  }

  sharedKeyCredential = new StorageSharedKeyCredential(
    process.env.AZURE_STORAGE_ACCOUNT_NAME,
    process.env.AZURE_STORAGE_ACCOUNT_KEY
  );

  const accountUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;
  blobServiceClient = new BlobServiceClient(accountUrl, sharedKeyCredential);
  containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);
};

const getContainerClient = () => {
  if (!containerClient) {
    initBlobService();
  }
  return containerClient;
};

const uploadBuffer = async (blobName, buffer, contentType) => {
  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType }
  });
  return blobName;
};

const deleteBlob = async (blobName) => {
  if (!blobName) return;
  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};

const generateReadSasUrl = async (blobName) => {
  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(blobName);

  const startsOn = new Date(Date.now() - 60 * 1000);
  const expiresOn = new Date(Date.now() + SAS_EXPIRY_MINUTES * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn
    },
    sharedKeyCredential
  ).toString();

  return `${blockBlobClient.url}?${sas}`;
};

module.exports = {
  isConfigured,
  getContainerClient,
  uploadBuffer,
  deleteBlob,
  generateReadSasUrl,
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZE_BYTES
};
