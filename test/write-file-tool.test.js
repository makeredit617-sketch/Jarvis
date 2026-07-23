const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createWriteFileTool } = require("../src/tools/adapters/write-file.tool");

function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "jarvis-workspace-"));
}

test("writes a file inside the workspace and reports success", () => {
  const workspaceDir = makeWorkspace();
  const tool = createWriteFileTool({ workspaceDir });

  const result = tool.execute({ file: "notes/hello.txt", content: "hi there" });

  assert.equal(result.success, true);
  assert.equal(result.file, "notes/hello.txt");
  assert.equal(fs.readFileSync(result.path, "utf8"), "hi there");

  fs.rmSync(workspaceDir, { recursive: true, force: true });
});

test("rejects path traversal outside the workspace", () => {
  const workspaceDir = makeWorkspace();
  const tool = createWriteFileTool({ workspaceDir });

  const result = tool.execute({ file: "../escape.txt", content: "bad" });

  assert.equal(result.success, false);
  assert.match(result.error, /traversal/i);
  assert.equal(fs.existsSync(path.join(path.dirname(workspaceDir), "escape.txt")), false);

  fs.rmSync(workspaceDir, { recursive: true, force: true });
});

test("rejects absolute paths", () => {
  const workspaceDir = makeWorkspace();
  const tool = createWriteFileTool({ workspaceDir });

  const result = tool.execute({ file: "/etc/jarvis-should-not-write-here.txt", content: "bad" });

  assert.equal(result.success, false);
  assert.match(result.error, /absolute/i);

  fs.rmSync(workspaceDir, { recursive: true, force: true });
});

test("returns the actual resolved path from the tool, not an assumed one", () => {
  const workspaceDir = makeWorkspace();
  const tool = createWriteFileTool({ workspaceDir });

  const result = tool.execute({ file: "output.py", content: "print(1)" });

  assert.equal(result.path, path.join(path.resolve(workspaceDir), "output.py"));
  assert.equal(fs.existsSync(result.path), true);

  fs.rmSync(workspaceDir, { recursive: true, force: true });
});
