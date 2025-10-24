import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
type Context = any;
type HttpRequest = any;
type AzureFunction = (context: Context, req: HttpRequest) => Promise<void>;
import sql from "mssql";

interface TeamIssue {
  title: string;
  description: string;
  priority: string;
  reporter: string;
  tags: string;
}

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

function parseTeamIssue(raw: unknown): TeamIssue | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const { title, description, priority, reporter, tags } = record;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof priority !== "string" ||
    typeof reporter !== "string"
  ) {
    return null;
  }

  let normalizedTags = "";
  if (Array.isArray(tags)) {
    normalizedTags = tags.filter((tag): tag is string => typeof tag === "string").join(",");
  } else if (typeof tags === "string") {
    normalizedTags = tags;
  }

  return {
    title,
    description,
    priority,
    reporter,
    tags: normalizedTags
  };
}

async function insertIntoSql(records: TeamIssue[], config: sql.config): Promise<void> {
  let pool: sql.ConnectionPool | undefined;

  try {
    pool = await sql.connect(config);

    for (const record of records) {
      await pool
        .request()
        .input("title", sql.NVarChar, record.title)
        .input("description", sql.NVarChar, record.description)
        .input("priority", sql.NVarChar, record.priority)
        .input("reporter", sql.NVarChar, record.reporter)
        .input("tags", sql.NVarChar, record.tags)
        .query(
          "INSERT INTO dbo.TeamIssues (title, description, priority, reporter, tags) VALUES (@title, @description, @priority, @reporter, @tags)"
        );
    }
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

const insertTeamIssues: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  const body = req.body as unknown;
  const issuesPayload = Array.isArray(body) ? body : (body as { issues?: unknown })?.issues;

  if (!Array.isArray(issuesPayload)) {
    context.res = {
      status: 400,
      body: { error: "Request body must contain an array of issues." }
    };
    return;
  }

  const issues: TeamIssue[] = [];

  for (const rawIssue of issuesPayload) {
    const issue = parseTeamIssue(rawIssue);
    if (!issue) {
      context.res = {
        status: 400,
        body: { error: "Each issue must include title, description, priority, and reporter fields." }
      };
      return;
    }

    issues.push(issue);
  }

  if (issues.length === 0) {
    context.res = {
      status: 400,
      body: { error: "No valid issues provided." }
    };
    return;
  }

  try {
    const sqlConfig = await createSqlConfig();
    await insertIntoSql(issues, sqlConfig);

    context.res = {
      status: 201,
      body: { success: true, inserted: issues.length }
    };
  } catch (error: unknown) {
    context.log.error("Error inserting team issues:", error);
    context.res = {
      status: 500,
      body: { error: "Failed to insert team issues" }
    };
  }
};

export default insertTeamIssues;