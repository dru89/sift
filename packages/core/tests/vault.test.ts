import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createTestVault, testConfig, type TestVault } from "./helpers.js";
import { vaultWrite, vaultReplace } from "../src/vault.js";

describe("vaultWrite", () => {
  let vault: TestVault;

  beforeEach(async () => {
    vault = await createTestVault();
  });

  afterEach(async () => {
    await vault.cleanup();
  });

  it("creates a new file", async () => {
    const config = testConfig(vault.path);
    const result = await vaultWrite(config, "Notes/test-note.md", "# Test\n\nHello world.");

    expect(result.created).toBe(true);
    expect(result.path).toBe("Notes/test-note.md");

    const content = await readFile(join(vault.path, "Notes/test-note.md"), "utf-8");
    expect(content).toBe("# Test\n\nHello world.");
  });

  it("overwrites an existing file", async () => {
    const config = testConfig(vault.path);
    const result = await vaultWrite(config, "Projects/Test Project.md", "Completely new content");

    expect(result.created).toBe(false);

    const content = await readFile(join(vault.path, "Projects/Test Project.md"), "utf-8");
    expect(content).toBe("Completely new content");
  });

  it("creates parent directories", async () => {
    const config = testConfig(vault.path);
    await vaultWrite(config, "Deep/Nested/Path/file.md", "content");

    const content = await readFile(join(vault.path, "Deep/Nested/Path/file.md"), "utf-8");
    expect(content).toBe("content");
  });

  it("rejects paths that escape the vault", async () => {
    const config = testConfig(vault.path);
    await expect(vaultWrite(config, "../outside.md", "bad")).rejects.toThrow("cannot escape");
    await expect(vaultWrite(config, "/etc/passwd", "bad")).rejects.toThrow("cannot escape");
  });
});

describe("vaultReplace", () => {
  let vault: TestVault;

  beforeEach(async () => {
    vault = await createTestVault();
  });

  afterEach(async () => {
    await vault.cleanup();
  });

  it("replaces a unique string", async () => {
    const config = testConfig(vault.path);
    const result = await vaultReplace(
      config,
      "Projects/Test Project.md",
      "A test project for integration testing.",
      "A production project for real work.",
    );

    expect(result.path).toBe("Projects/Test Project.md");
    const content = await readFile(join(vault.path, "Projects/Test Project.md"), "utf-8");
    expect(content).toContain("A production project for real work.");
    expect(content).not.toContain("A test project for integration testing.");
  });

  it("deletes content when new_str is empty", async () => {
    const config = testConfig(vault.path);
    await vaultReplace(config, "Projects/Test Project.md", "A test project for integration testing.\n", "");

    const content = await readFile(join(vault.path, "Projects/Test Project.md"), "utf-8");
    expect(content).not.toContain("A test project for integration testing.");
  });

  it("fails if old_str is not found", async () => {
    const config = testConfig(vault.path);
    await expect(
      vaultReplace(config, "Projects/Test Project.md", "nonexistent string", "replacement"),
    ).rejects.toThrow("not found");
  });

  it("fails if old_str matches multiple times", async () => {
    const config = testConfig(vault.path);
    // "## " appears multiple times in the project file (## Overview, ## Tasks, ## Notes, ## Changelog)
    await expect(
      vaultReplace(config, "Projects/Test Project.md", "##", "###"),
    ).rejects.toThrow("multiple matches");
  });

  it("fails if file does not exist", async () => {
    const config = testConfig(vault.path);
    await expect(
      vaultReplace(config, "nonexistent.md", "old", "new"),
    ).rejects.toThrow("not found");
  });

  it("rejects paths that escape the vault", async () => {
    const config = testConfig(vault.path);
    await expect(
      vaultReplace(config, "../outside.md", "old", "new"),
    ).rejects.toThrow("cannot escape");
  });
});
