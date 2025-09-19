import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { Connection, Request } from 'tedious';

interface ConnectionConfig {
  server: string;
  authentication: {
    type: string;
    options: {
      credential: DefaultAzureCredential;
    };
  };
  options: {
    database: string;
    encrypt: true;
    port: 1433;
  };
}

export async function getInstructionDocuments(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing getInstructionDocuments request');

  try {
    // Get instruction reference from query params
    const instructionRef = request.query.get('instructionRef');
    
    if (!instructionRef) {
      return {
        status: 400,
        body: JSON.stringify({ error: 'instructionRef query parameter is required' })
      };
    }

    // Database connection config
    const config: ConnectionConfig = {
      server: 'instructions.database.windows.net',
      authentication: {
        type: 'azure-active-directory-default',
        options: {
          credential: new DefaultAzureCredential()
        }
      },
      options: {
        database: 'instructions',
        encrypt: true,
        port: 1433
      }
    };

    const connection = new Connection(config);
    
    const documents = await new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      
      connection.on('connect', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        const query = `
          SELECT 
            DocumentId,
            InstructionRef,
            DocumentType,
            FileName,
            BlobUrl,
            FileSizeBytes,
            UploadedBy,
            UploadedAt,
            Notes
          FROM dbo.Documents 
          WHERE InstructionRef = @instructionRef
          ORDER BY UploadedAt DESC
        `;
        
        const dbRequest = new Request(query, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
          connection.close();
        });
        
        dbRequest.addParameter('instructionRef', 'NVarChar', instructionRef);
        
        dbRequest.on('row', (columns) => {
          const row: any = {};
          columns.forEach((column) => {
            row[column.metadata.colName] = column.value;
          });
          results.push(row);
        });
        
        connection.execSql(dbRequest);
      });
      
      connection.on('error', (err) => {
        reject(err);
      });
    });

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(documents)
    };

  } catch (error: any) {
    context.error('Error in getInstructionDocuments:', error);
    return {
      status: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch instruction documents',
        details: error.message 
      })
    };
  }
}

app.http('getInstructionDocuments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getInstructionDocuments,
});
