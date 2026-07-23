const fs = require("fs");
const path = require("path");

/**
 * A narrowly scoped file-write tool. Writes are restricted to an explicit
 * workspace directory. Absolute paths and path traversal outside the
 * workspace are rejected before any filesystem call is made.
 */
function createWriteFileTool({ workspaceDir }) {
  return {
    name: "writeFile",
    execute({ file, content }) {
      try {
        const resolvedPath = resolveSafePath(workspaceDir, file);
        fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
        fs.writeFileSync(resolvedPath, content ?? "");
        return { success: true, file, path: resolvedPath };
      } catch (error) {
        return { success: false, file, error: error.message };
      }
    }
  };
}

function resolveSafePath(workspaceDir, requestedFile) {
  if (typeof requestedFile !== "string" || requestedFile.trim() === "") {
    throw new Error("File path must be a non-empty string.");
  }
  if (path.isAbsolute(requestedFile)) {
    throw new Error(`Absolute paths are not allowed: ${requestedFile}`);
  }

  const resolvedWorkspace = path.resolve(workspaceDir);
  const resolvedTarget = path.resolve(resolvedWorkspace, requestedFile);
  const relative = path.relative(resolvedWorkspace, resolvedTarget);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path traversal outside workspace is not allowed: ${requestedFile}`);
  }

  return resolvedTarget;
}

module.exports = { createWriteFileTool, resolveSafePath };
