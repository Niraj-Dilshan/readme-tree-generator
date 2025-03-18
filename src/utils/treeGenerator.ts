import * as fs from "fs";
import * as path from "path";

/**
 * Check if a file/folder should be excluded based on patterns
 * @param name - File or folder name
 * @param excludePatterns - Glob patterns to exclude
 * @returns True if should be excluded
 */
function shouldExclude(name: string, excludePatterns: string[]): boolean {
  return excludePatterns.some((pattern) => {
    // Simple glob matching for common patterns
    if (pattern === name) {
      return true;
    }
    if (pattern.endsWith("*") && name.startsWith(pattern.slice(0, -1))) {
      return true;
    }
    return false;
  });
}

/**
 * Generate an ASCII tree representation of the folder structure
 * @param rootPath - The root folder path
 * @param rootName - Name to display for the root
 * @param excludePatterns - Patterns to exclude
 * @param maxDepth - Maximum depth to traverse (-1 for unlimited)
 * @returns ASCII tree representation
 */
function generateAsciiTree(
  rootPath: string,
  rootName: string,
  excludePatterns: string[] = [],
  maxDepth: number = -1
): string {
  let result = `${rootName}/\n`;

  function traverseFileSystem(
    dir: string,
    prefix: string = "",
    depth: number = 0
  ): void {
    if (maxDepth !== -1 && depth >= maxDepth) {
      return;
    }

    const items = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((item) => !shouldExclude(item.name, excludePatterns))
      .sort((a, b) => {
        // Folders first, then files
        if (a.isDirectory() && !b.isDirectory()) {
          return -1;
        }
        if (!a.isDirectory() && b.isDirectory()) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const itemPrefix = isLast ? "└── " : "├── ";
      const childPrefix = isLast ? "    " : "│   ";

      result += `${prefix}${itemPrefix}${item.name}${
        item.isDirectory() ? "/" : ""
      }\n`;

      if (item.isDirectory()) {
        traverseFileSystem(
          path.join(dir, item.name),
          prefix + childPrefix,
          depth + 1
        );
      }
    });
  }

  traverseFileSystem(rootPath);
  return result;
}

/**
 * Generate a Markdown tree representation of the folder structure
 * @param rootPath - The root folder path
 * @param rootName - Name to display for the root
 * @param excludePatterns - Patterns to exclude
 * @param maxDepth - Maximum depth to traverse (-1 for unlimited)
 * @returns Markdown tree representation
 */
function generateMarkdownTree(
  rootPath: string,
  rootName: string,
  excludePatterns: string[] = [],
  maxDepth: number = -1
): string {
  let result = `- ${rootName}/\n`;

  function traverseFileSystem(
    dir: string,
    prefix: string = "  ",
    depth: number = 0
  ): void {
    if (maxDepth !== -1 && depth >= maxDepth) {
      return;
    }

    const items = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((item) => !shouldExclude(item.name, excludePatterns))
      .sort((a, b) => {
        // Folders first, then files
        if (a.isDirectory() && !b.isDirectory()) {
          return -1;
        }
        if (!a.isDirectory() && b.isDirectory()) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });

    items.forEach((item) => {
      result += `${prefix}- ${item.name}${item.isDirectory() ? "/" : ""}\n`;

      if (item.isDirectory()) {
        traverseFileSystem(path.join(dir, item.name), prefix + "  ", depth + 1);
      }
    });
  }

  traverseFileSystem(rootPath);
  return result;
}

export { generateAsciiTree, generateMarkdownTree };
