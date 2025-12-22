const sql = require("mssql");

const sqlServer = "helix-database-server.database.windows.net";
const sqlUser = "helix-database-server";
const sqlDatabase = "helix-core-data";
const secretName = "helix-database-password";

let helixCorePool = null;

async function getHelixCorePool(secretClient) {
  if (helixCorePool) {
    return helixCorePool;
  }

  if (!secretClient) {
    throw new Error("SecretClient instance is required to fetch SQL credentials.");
  }

  let sqlPassword;

  try {
    const secret = await secretClient.getSecret(secretName);
    sqlPassword = secret && secret.value;
  } catch (error) {
    throw new Error(
      `Failed to connect to SQL Server for helix-core-data DB: ${error.message || error}`
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
    helixCorePool = pool;
    return helixCorePool;
  } catch (error) {
    throw new Error(
      `Failed to connect to SQL Server for helix-core-data DB: ${error.message || error}`
    );
  }
}

module.exports = { getHelixCorePool };
