import * as fs from "node:fs/promises";
import * as path from "node:path";
import { type SiftConfig } from "./types.js";

/**
 * Result of a vault_write operation.
 */
export interface VaultWriteResult {
  /** The vault-relative path that was written */
  path: string;
  /** Whether the file was created (true) or overwritten (false) */
  created: boolean;
}

/**
 * Result of a vault_replace operation.
 */
export interface VaultReplaceResult {
  /** The vault-relative path that was modified */
  path: string;
  /** Number of characters in the old string that was replaced */
  replacedLength: number;
  /** Number of characters in the new string */
  newLength: number;
}

/**
 * Write content to a vault file. Creates the file if it doesn't exist;
 * overwrites if it does.
 *
 * @param config - The sift configuration
 * @param vaultPath - Vault-relative path (e.g., "Health Tracker/_shortcut-log.md")
 * @param content - Full file content to write
 */
export async function vaultWrite(
  config: SiftConfig,
  vaultPath: string,
  content: string,
): Promise<VaultWriteResult> {
  // Prevent path traversal outside the vault
  const normalized = path.normalize(vaultPath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(`Invalid path: "${vaultPath}". Path must be relative to the vault root and cannot escape it.`);
  }

  const fullPath = path.join(config.vaultPath, normalized);

  // Check if file exists (for created/overwritten distinction)
  let created = false;
  try {
    await fs.access(fullPath);
  } catch {
    created = true;
  }

  // Ensure directory exists
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  await fs.writeFile(fullPath, content, "utf-8");

  return { path: normalized, created };
}

/**
 * Perform a targeted find-and-replace within a vault file.
 * The old string must match exactly once in the file.
 *
 * @param config - The sift configuration
 * @param vaultPath - Vault-relative path
 * @param oldStr - Exact string to find (must match exactly once)
 * @param newStr - Replacement string (empty string to delete the match)
 */
export async function vaultReplace(
  config: SiftConfig,
  vaultPath: string,
  oldStr: string,
  newStr: string,
): Promise<VaultReplaceResult> {
  const normalized = path.normalize(vaultPath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(`Invalid path: "${vaultPath}". Path must be relative to the vault root and cannot escape it.`);
  }

  const fullPath = path.join(config.vaultPath, normalized);

  let content: string;
  try {
    content = await fs.readFile(fullPath, "utf-8");
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error(`File not found: "${vaultPath}"`);
    }
    throw err;
  }

  // Count occurrences
  const firstIdx = content.indexOf(oldStr);
  if (firstIdx === -1) {
    throw new Error(`oldString not found in "${vaultPath}".`);
  }

  const secondIdx = content.indexOf(oldStr, firstIdx + 1);
  if (secondIdx !== -1) {
    throw new Error(
      `Found multiple matches for oldString in "${vaultPath}". Provide more surrounding context to identify the correct match.`,
    );
  }

  // Perform the replacement
  const updated = content.slice(0, firstIdx) + newStr + content.slice(firstIdx + oldStr.length);
  await fs.writeFile(fullPath, updated, "utf-8");

  return {
    path: normalized,
    replacedLength: oldStr.length,
    newLength: newStr.length,
  };
}
