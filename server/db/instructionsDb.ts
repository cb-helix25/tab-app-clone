import sql from "mssql";
import { SecretClient } from "@azure/keyvault-secrets";

const sqlServer = "instructions.database.windows.net";
const sqlUser = "instructionsadmin";
const sqlDatabase = "instructions";

let instructionsPool: sql.ConnectionPool | null = null;

export async function getInstructionsPool(
  secretClient: SecretClient
): Promise<sql.ConnectionPool> {
  if (instructionsPool) {
    return instructionsPool;
  }

  if (!secretClient) {
    throw new Error("SecretClient instance is required to fetch SQL credentials.");
  }

  const secretName = "helix-instructions-password";
  let sqlPassword: string | undefined;

  try {
    sqlPassword = (await secretClient.getSecret(secretName)).value;
  } catch (error) {
    throw new Error(
      `Failed to retrieve SQL password secret "${secretName}": ${
        (error as Error).message || error
      }`
    );
  }

  if (!sqlPassword) {
    throw new Error(
      `SQL password secret "${secretName}" does not contain a value.`
    );
  }

  try {
    const pool = new sql.ConnectionPool({
      server: sqlServer,
      user: sqlUser,
      password: sqlPassword,
      database: sqlDatabase,
      options: { encrypt: true },
    });

    await pool.connect();
    instructionsPool = pool;
    return instructionsPool;
  } catch (error) {
    throw new Error(
      `Failed to connect to SQL Server for instructions DB: ${
        (error as Error).message || error
      }`
    );
  }
}