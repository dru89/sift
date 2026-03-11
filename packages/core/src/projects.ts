import * as fs from "node:fs/promises";
import * as path from "node:path";
import { glob } from "glob";
import { type SiftConfig, type ProjectInfo } from "./types.js";
import { localToday } from "./dates.js";

/** Return a string value from a frontmatter field, or undefined if blank/array. */
function scalar(val: unknown): string | undefined {
  if (typeof val === "string" && val.trim()) return val.trim();
  return undefined;
}

/**
 * List all projects in the vault by scanning the projects folder
 * for markdown files with `type: project` frontmatter.
 *
 * @param config - The sift configuration
 * @returns Array of project info objects, sorted alphabetically by name
 */
export async function listProjects(config: SiftConfig): Promise<ProjectInfo[]> {
  const projectsDir = path.join(config.vaultPath, config.projectsPath);

  // Check if the projects directory exists
  try {
    await fs.access(projectsDir);
  } catch {
    return [];
  }

  const files = await glob("*.md", {
    cwd: projectsDir,
    absolute: false,
  });

  const projects: ProjectInfo[] = [];

  for (const file of files) {
    const fullPath = path.join(projectsDir, file);
    const content = await fs.readFile(fullPath, "utf-8");
    const frontmatter = parseFrontmatter(content);

    // Only include files that have type: project in frontmatter
    if (frontmatter?.type !== "project") continue;

    const name = path.basename(file, ".md");
    const filePath = path.join(config.projectsPath, file);

    // Use scalar() to guard against parseFrontmatter returning empty arrays for blank fields
    projects.push({
      name,
      filePath,
      status: scalar(frontmatter.status),
      timeframe: scalar(frontmatter.timeframe),
      tags: Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0 ? frontmatter.tags : undefined,
      created: scalar(frontmatter.created),
    });
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find a project by name (case-insensitive).
 *
 * @param config - The sift configuration
 * @param name - The project name to search for
 * @returns The matching project, or null if not found
 */
export async function findProject(
  config: SiftConfig,
  name: string,
): Promise<ProjectInfo | null> {
  const projects = await listProjects(config);
  const lower = name.toLowerCase();
  return projects.find((p) => p.name.toLowerCase() === lower) || null;
}

/**
 * Create a new project file from the configured template.
 *
 * @param config - The sift configuration
 * @param name - The project name (becomes the filename)
 * @returns The file path (relative to vault root) of the created project
 * @throws If the project already exists
 */
export async function createProject(
  config: SiftConfig,
  name: string,
): Promise<string> {
  const filePath = path.join(config.projectsPath, `${name}.md`);
  const fullPath = path.join(config.vaultPath, filePath);

  // Check if project already exists
  try {
    await fs.access(fullPath);
    throw new Error(`Project "${name}" already exists at ${filePath}`);
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
  }

  // Ensure the projects directory exists
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  // Try to read the template
  let content: string;
  const templatePath = path.join(config.vaultPath, config.projectTemplatePath);
  try {
    const template = await fs.readFile(templatePath, "utf-8");
    content = stripTemplaterSyntax(template);
  } catch {
    // Template doesn't exist, use a sensible default
    content = getDefaultProjectTemplate();
  }

  // Inject today's date as the created field
  content = injectFrontmatterField(content, "created", localToday());

  await fs.writeFile(fullPath, content, "utf-8");
  return filePath;
}

/**
 * Strip Obsidian Templater plugin syntax from template content.
 * Removes `<% ... %>` blocks since we're creating files outside of Obsidian.
 */
function stripTemplaterSyntax(content: string): string {
  // Remove inline templater expressions (e.g., <% tp.file.cursor() %>)
  return content.replace(/<%[\s\S]*?%>\s*/g, "").replace(/\n{3,}/g, "\n\n");
}

/**
 * Inject or replace a frontmatter field in markdown content.
 * If the field already exists (even if empty), its value is replaced.
 * If the field doesn't exist, it is appended before the closing `---`.
 *
 * Accepts string or string[] values. Arrays are written as inline YAML:
 * `tags: [tag1, tag2]`. Multi-line list format in existing content is
 * collapsed to inline on write.
 */
function injectFrontmatterField(content: string, key: string, value: string | string[]): string {
  if (!content.startsWith("---")) return content;
  const endIdx = content.indexOf("---", 3);
  if (endIdx === -1) return content;

  const serialized = Array.isArray(value)
    ? value.length > 0 ? `[${value.join(", ")}]` : ""
    : value;

  const frontmatter = content.slice(0, endIdx);
  const rest = content.slice(endIdx);

  // For array fields, also consume any following indented list items (multi-line format)
  const fieldRegex = Array.isArray(value)
    ? new RegExp(`^${key}:.*(?:\\n[ \\t]+-.*)*`, "m")
    : new RegExp(`^${key}:.*$`, "m");

  if (fieldRegex.test(frontmatter)) {
    return frontmatter.replace(fieldRegex, `${key}: ${serialized}`) + rest;
  }

  // Field not present — insert before closing ---
  return frontmatter + `${key}: ${serialized}\n` + rest;
}

/**
 * Set a frontmatter field on an existing project file.
 *
 * @param config - The sift configuration
 * @param name - The project name
 * @param key - The frontmatter key to set (e.g. "status")
 * @param value - The value to set
 * @throws If the project is not found
 */
export async function setProjectField(
  config: SiftConfig,
  name: string,
  key: string,
  value: string | string[],
): Promise<void> {
  const project = await findProject(config, name);
  if (!project) {
    throw new Error(`Project "${name}" not found`);
  }

  const fullPath = path.join(config.vaultPath, project.filePath);
  const content = await fs.readFile(fullPath, "utf-8");
  const updated = injectFrontmatterField(content, key, value);
  await fs.writeFile(fullPath, updated, "utf-8");
}

/**
 * Default project template used when no template file is configured or found.
 */
function getDefaultProjectTemplate(): string {
  return `---
type: project
status:
created:
timeframe:
teams:
collaborators:
tags:
---
## Overview


## Goals


## Notes
`;
}

/**
 * Minimal frontmatter parser. Extracts YAML frontmatter from markdown content
 * delimited by `---` fences. Returns null if no frontmatter found.
 *
 * Handles simple key: value pairs, lists (both inline [a, b] and indented - item),
 * and treats empty values as empty strings.
 */
function parseFrontmatter(content: string): Record<string, any> | null {
  if (!content.startsWith("---")) return null;

  const endIdx = content.indexOf("---", 3);
  if (endIdx === -1) return null;

  const yaml = content.slice(3, endIdx).trim();
  if (!yaml) return null;

  const result: Record<string, any> = {};

  const lines = yaml.split("\n");
  let currentKey: string | null = null;
  let currentList: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // List continuation (indented - item)
    if (currentKey && currentList && trimmed.startsWith("- ")) {
      currentList.push(trimmed.slice(2).trim());
      continue;
    }

    // Flush any pending list
    if (currentKey && currentList) {
      result[currentKey] = currentList;
      currentKey = null;
      currentList = null;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();

    if (!rawValue) {
      // Empty value — could be start of a list on next lines, or just empty
      currentKey = key;
      currentList = [];
      result[key] = "";
      continue;
    }

    // Inline array: [tag1, tag2]
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const inner = rawValue.slice(1, -1);
      result[key] = inner
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }

    result[key] = rawValue;
  }

  // Flush any pending list
  if (currentKey && currentList && currentList.length > 0) {
    result[currentKey] = currentList;
  }

  return result;
}
