const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const {
    BlobServiceClient,
    StorageSharedKeyCredential,
    BlobSASPermissions,
    generateBlobSASQueryParameters,
} = require('@azure/storage-blob');
const sql = require('mssql');

const router = express.Router();

// Database connection configuration
let dbConfig = null;

async function getDbConfig() {
  if (dbConfig) return dbConfig;
  
  // Use the INSTRUCTIONS_SQL_CONNECTION_STRING from .env
  const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
  }
  
  // Parse connection string into config object
  const params = new URLSearchParams(connectionString.split(';').join('&'));
  const server = params.get('Server').replace('tcp:', '').split(',')[0];
  const database = params.get('Initial Catalog');
  const user = params.get('User ID');
  const password = params.get('Password');
  
  dbConfig = {
    server,
    database, 
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true
    }
  };
  
  return dbConfig;
}

// Database connection pool
let pool;

// Blob service client (reused)
let blobServiceClient = null;
const storageAccountName = 'instructionfiles';

function getBlobServiceClient() {
    if (blobServiceClient) return blobServiceClient;

    const connectionString = process.env.INSTRUCTIONS_STORAGE_CONNECTION_STRING || process.env.AZURE_STORAGE_CONNECTION_STRING;
    const accountKey = process.env.INSTRUCTIONS_STORAGE_ACCOUNT_KEY || process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (connectionString) {
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        return blobServiceClient;
    }
    if (accountKey) {
        const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, accountKey);
        blobServiceClient = new BlobServiceClient(
            `https://${storageAccountName}.blob.core.windows.net`,
            sharedKeyCredential
        );
        return blobServiceClient;
    }
    // Fall back to DefaultAzureCredential (managed identity or dev login)
    const credential = new DefaultAzureCredential();
    blobServiceClient = new BlobServiceClient(
        `https://${storageAccountName}.blob.core.windows.net`,
        credential
    );
    return blobServiceClient;
}

async function generateBlobSasUrl(containerName, blobName, filename, minutes = 15) {
    try {
        const svc = getBlobServiceClient();

        // If service is using shared key, we can build SAS directly. Detect via credential type.
        // Access to underlying credential isn't public; try to create either shared-key SAS or user delegation SAS.
        const now = new Date();
        const startsOn = new Date(now.valueOf() - 5 * 60 * 1000); // 5 min clock skew
        const expiresOn = new Date(now.valueOf() + minutes * 60 * 1000);

        // Attempt user delegation SAS via AAD first; if it fails, try shared key if available
        try {
            // getUserDelegationKey works only with AAD credentials and requires appropriate RBAC
            const userDelegationKey = await svc.getUserDelegationKey(startsOn, expiresOn);
            const sas = generateBlobSASQueryParameters(
                {
                    containerName,
                    blobName,
                    permissions: BlobSASPermissions.parse('r'),
                    startsOn,
                    expiresOn,
                    contentDisposition: filename ? `inline; filename="${filename}"` : undefined,
                },
                userDelegationKey,
                storageAccountName
            ).toString();
            return `https://${storageAccountName}.blob.core.windows.net/${encodeURIComponent(containerName)}/${encodeURIComponent(blobName)}?${sas}`;
        } catch (e) {
            // Try shared key path when available
            const accountKey = process.env.INSTRUCTIONS_STORAGE_ACCOUNT_KEY || process.env.AZURE_STORAGE_ACCOUNT_KEY;
            if (!accountKey) throw e;
            const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, accountKey);
            const sas = generateBlobSASQueryParameters(
                {
                    containerName,
                    blobName,
                    permissions: BlobSASPermissions.parse('r'),
                    startsOn,
                    expiresOn,
                    contentDisposition: filename ? `inline; filename="${filename}"` : undefined,
                },
                sharedKeyCredential
            ).toString();
            return `https://${storageAccountName}.blob.core.windows.net/${encodeURIComponent(containerName)}/${encodeURIComponent(blobName)}?${sas}`;
        }
    } catch (err) {
        // Best effort; return null to allow caller to fallback
        return null;
    }
}

// Initialize database connection
async function initializeDatabase() {
    if (!pool) {
        const config = await getDbConfig();
        pool = new sql.ConnectionPool(config);
        await pool.connect();
    }
    return pool;
}

/**
 * Get documents for a specific instruction
 */
router.get('/:instructionRef', async (req, res) => {
    try {
        const { instructionRef } = req.params;
        
        // Initialize database connection
        await initializeDatabase();
        
        // Query documents from database
        const result = await pool.request()
            .input('instructionRef', instructionRef)
            .query(`
                SELECT DocumentId, InstructionRef, FileName, BlobUrl, FileSizeBytes, 
                       UploadedBy, UploadedAt
                FROM Documents 
                WHERE InstructionRef = @instructionRef
                ORDER BY UploadedAt DESC
            `);
                // Precompute preview URLs; for Office docs we prefer a short-lived SAS URL so Office Online can fetch it
                const officeExts = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
                const docsOut = [];
                for (const doc of result.recordset) {
                    const fileName = doc.FileName || '';
                    const ext = (fileName.split('.').pop() || '').toLowerCase();

                    let previewUrl = `/api/documents/preview/${instructionRef}/${doc.DocumentId}`; // default proxy

                    if (officeExts.has(ext) && doc.BlobUrl) {
                        try {
                            const urlObj = new URL(doc.BlobUrl);
                            const parts = urlObj.pathname.split('/');
                            const container = parts[1];
                            const blob = decodeURIComponent(parts.slice(2).join('/'));
                            const sasUrl = await generateBlobSasUrl(container, blob, fileName, 15);
                            if (sasUrl) {
                                // Use SAS URL as the preview base; client will wrap with Office viewer
                                previewUrl = sasUrl;
                            }
                        } catch { /* fallback to proxy */ }
                    }

                    docsOut.push({
                        ...doc,
                        previewUrl, // used by client for iframe or Office viewer src
                        directUrl: doc.BlobUrl,
                        authWarning: 'Preview uses short-lived access; link expires soon.'
                    });
                }

                res.json(docsOut);
        
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

/**
 * Proxy document preview with Azure authentication
 */
router.get('/preview/:instructionRef/:documentId', async (req, res) => {
    try {
        const { instructionRef, documentId } = req.params;
        
        // Initialize database connection
        await initializeDatabase();
        
        // Get document details from database
        const result = await pool.request()
            .input('instructionRef', instructionRef)
            .input('documentId', documentId)
            .query(`
                SELECT BlobUrl, FileName 
                FROM Documents 
                WHERE InstructionRef = @instructionRef AND DocumentId = @documentId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const { BlobUrl, FileName } = result.recordset[0];
        
        // Try different authentication approaches
        const blobServiceClient = getBlobServiceClient();
        
        // Parse blob URL to get container and blob name
        const url = new URL(BlobUrl);
        const pathParts = url.pathname.split('/');
        const containerName = pathParts[1];
        const blobName = pathParts.slice(2).join('/');
        
        // Get blob client
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(decodeURIComponent(blobName));
        
        // Check if blob exists
        const exists = await blobClient.exists();
        if (!exists) {
            return res.status(404).json({ error: 'File not found in storage' });
        }
        
        // Get blob properties for content type
        const properties = await blobClient.getProperties();
        
        // Set appropriate headers
        res.setHeader('Content-Type', properties.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${FileName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // Stream the blob to response
        const downloadResponse = await blobClient.download();
        downloadResponse.readableStreamBody.pipe(res);
        
    } catch (error) {
        console.error('Error proxying document:', error);
        
        // Handle specific Azure errors
        if (error.code === 'AuthenticationFailed') {
            console.warn('Authentication failed for blob storage, falling back to direct URL');
            return res.redirect(BlobUrl);
        }
        if (error.code === 'AuthorizationFailed') {
            console.warn('Authorization failed for blob storage, falling back to direct URL');  
            return res.redirect(BlobUrl);
        }
        if (error.message && error.message.includes('PublicAccessNotPermitted')) {
            console.warn('Public access not permitted, falling back to direct URL');
            return res.redirect(BlobUrl);
        }
        
        res.status(500).json({ error: 'Failed to retrieve document' });
    }
});

module.exports = router;