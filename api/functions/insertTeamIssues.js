// Import Azure identity and Key Vault client libraries
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
// Import SQL Server client
const sql = require("mssql");

// Insert activity records into the SQL database
async function insertIntoSql(records, connStr) {
  // Connect to SQL Server using the provided connection string
  const pool = await sql.connect(connStr);
  try {
    for (const r of records) {
      // Insert each activity record using parameterized queries
      await pool
        .request()
        .input("title", sql.NVarChar, r.title)
        .input("description", sql.NVarChar, r.description)
        .input("priority", sql.NVarChar, r.priority)
        .input("reporter", sql.NVarChar, r.reporter)
        .input("tags", sql.NVarChar, r.tags)
        .query(
          "INSERT INTO dbo.TeamIssues (title, description, priority, reporter, tags) VALUES (@title, @description, @priority, @reporter, @tags)"
        ); // Removed Id from both column list and VALUES
    }
  } finally {
    // Close the SQL connection
    await pool.close();
  }
}

    // Authenticate to Azure and connect to Key Vault
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(process.env.KEY_VAULT_URL, credential);

    // Get SQL connection details (server, user, database, password)
    const sqlServer = "helix-database-server.database.windows.net";
    const sqlUser = "helix-database-server";
    const sqlDatabase = "helix-project-data";
    const sqlPassword = (await secretClient.getSecret("helix-database-password")).value;

    // Build the SQL connection string
    const sqlConnectionString = `mssql://${sqlUser}:${sqlPassword}@${sqlServer}/${sqlDatabase}?encrypt=true`;

    // Insert the fetched issues into the SQL database
    await insertIntoSql(issues, sqlConnectionString);