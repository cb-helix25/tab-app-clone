const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require('@azure/storage-blob');
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
        
        const documents = result.recordset.map(doc => ({
            ...doc,
            previewUrl: `/api/documents/preview/${instructionRef}/${doc.DocumentId}`,
            directUrl: doc.BlobUrl, // Provide direct URL as fallback
            authWarning: 'Storage account requires authentication - preview may not work directly'
        }));
        
        res.json(documents);
        
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
        let blobServiceClient;
        const storageAccountName = 'instructionfiles';
        
        // Check for storage account connection string or access key
        const connectionString = process.env.INSTRUCTIONS_STORAGE_CONNECTION_STRING || 
                                process.env.AZURE_STORAGE_CONNECTION_STRING;
        const accountKey = process.env.INSTRUCTIONS_STORAGE_ACCOUNT_KEY || 
                          process.env.AZURE_STORAGE_ACCOUNT_KEY;
        
        if (connectionString) {
            const { BlobServiceClient } = require('@azure/storage-blob');
            blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        } else if (accountKey) {
            const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
            const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, accountKey);
            blobServiceClient = new BlobServiceClient(
                `https://${storageAccountName}.blob.core.windows.net`,
                sharedKeyCredential
            );
        } else {
            // Fall back to DefaultAzureCredential
            const credential = new DefaultAzureCredential();
            blobServiceClient = new BlobServiceClient(
                `https://${storageAccountName}.blob.core.windows.net`,
                credential
            );
        }
        
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