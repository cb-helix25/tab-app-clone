const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const sql = require("mssql");

module.exports = async function (context, req) {
  try {
    // Authenticate to Azure and connect to Key Vault
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(process.env.KEY_VAULT_URL, credential);

    // Get SQL connection details
    const sqlServer = "helix-database-server.database.windows.net";
    const sqlUser = "helix-database-server";
    const sqlDatabase = "helix-project-data";
    const sqlPassword = (await secretClient.getSecret("helix-database-password")).value;

    // Build the SQL config object
    const sqlConfig = {
      user: sqlUser,
      password: sqlPassword,
      server: sqlServer,
      database: sqlDatabase,
      options: {
        encrypt: true
      }
    };

    // Connect and query
    await sql.connect(sqlConfig);
    const result = await sql.query`SELECT * FROM [dbo].[TeamIssues]`;

    context.res = {
      status: 200,
      body: result.recordset
    };
  } catch (err) {
    context.log.error("Error fetching team issues:", err);
    context.res = {
      status: 500,
      body: { error: "Failed to fetch team issues" }
    };
  }
};