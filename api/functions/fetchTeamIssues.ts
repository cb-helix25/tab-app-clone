import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
type Context = any;
type HttpRequest = any;
type AzureFunction = (context: Context, req: HttpRequest) => Promise<void>;
import sql from "mssql";

const credential = new DefaultAzureCredential();

async function createSqlConfig(): Promise<sql.config> {
  const keyVaultUrl = process.env.KEY_VAULT_URL;
  if (!keyVaultUrl) {
    throw new Error("KEY_VAULT_URL environment variable is not set.");
  }

  const secretClient = new SecretClient(keyVaultUrl, credential);
  const passwordSecret = await secretClient.getSecret("helix-database-password");
  const sqlPassword = passwordSecret.value;

  if (!sqlPassword) {
    throw new Error("Secret 'helix-database-password' does not contain a value.");
  }

  const sqlConfig: sql.config = {
    user: "helix-database-server",
    password: sqlPassword,
    server: "helix-database-server.database.windows.net",
    database: "helix-project-data",
    options: {
      encrypt: true
    }
  };

  return sqlConfig;
}

const fetchTeamIssues: AzureFunction = async (context: Context, _req: HttpRequest): Promise<void> => {
  let pool: sql.ConnectionPool | null = null;

  try {
    const sqlConfig = await createSqlConfig();
    pool = await sql.connect(sqlConfig);

    const result = await pool.request().query("SELECT * FROM [dbo].[TeamIssues]");

    context.res = {
      status: 200,
      body: result.recordset
    };
  } catch (error: unknown) {
    context.log.error("Error fetching team issues:", error);
    context.res = {
      status: 500,
      body: { error: "Failed to fetch team issues" }
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};

export default fetchTeamIssues;