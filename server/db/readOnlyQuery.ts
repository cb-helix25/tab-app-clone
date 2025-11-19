import { SecretClient } from "@azure/keyvault-secrets";
import { getInstructionsPool } from "./instructionsDb";

export async function queryReadOnly<T = any>(
  secretClient: SecretClient,
  sqlText: string,
  params?: Record<string, any>
): Promise<T[]> {
  const normalized = sqlText.trim().toUpperCase();

  if (!normalized.startsWith("SELECT")) {
    throw new Error("Read-only mode: only SELECT queries are allowed");
  }

  const pool = await getInstructionsPool(secretClient);
  const request = pool.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
  }

  const result = await request.query<T>(sqlText);
  return result.recordset;
}