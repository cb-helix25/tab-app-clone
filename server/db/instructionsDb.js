const sql = require("mssql");

const sqlServer = "instructions.database.windows.net";
const sqlUser = "instructionsadmin";
const sqlDatabase = "instructions";

let instructionsPool = null;

async function getInstructionsPool(secretClient) {
  if (instructionsPool) {
    return instructionsPool;
  }

  if (!secretClient) {
    throw new Error("SecretClient instance is required to fetch SQL credentials.");
  }

  const secretName = "helix-instructions-password";
  let sqlPassword

  try {
    const secret = await secretClient.getSecret(secretName);
    sqlPassword = secret && secret.value;
  } catch (error) {
    throw new Error(
      `Failed to connect to SQL Server for instructions DB: ${error.message || error}`
    );
  }

  if (!sqlPassword) {
    throw new Error(`SQL password secret "${secretName}" does not contain a value.`);
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
      `Failed to connect to SQL Server for instructions DB: ${error.message || error}`
    );
  }
}

module.exports = { getInstructionsPool };