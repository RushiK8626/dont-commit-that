import { execSync } from "child_process";
import { scanContent, Finding } from "../src/scanner/";

try {
    const repoPath = getGitRepoPath();
    const findings = scanStagedFiles(repoPath);

    if (findings.length > 0) {
        console.error("\n🚨 Don't Commit That!");
        console.error("Secrets detected in staged files:\n");

        for (const f of findings) {
            console.error(
                `- ${f.file}:${f.line} → ${f.type}`
            );
        }

        console.error("\nFix the issues or explicitly ignore them.");
        console.error("To bypass (not recommended): git commit --no-verify\n");

        process.exit(1); // BLOCK COMMIT
    }

    process.exit(0); // ALLOW COMMIT
} catch (err) {
    console.error("Error running pre-commit hook:", (err as Error).message);
    process.exit(1);
}


function getStagedFiles(repoPath: string): string[] {
    const output = execSync(
        "git diff --cached --name-only",
        { cwd: repoPath }
    )
        .toString()
        .trim();

    if (!output) { return []; }

    return output.split("\n");
}

function getStagedFileContent(
    repoPath: string,
    filePath: string
): string {
    return execSync(
        `git show :${filePath}`,
        { cwd: repoPath }
    ).toString();
}

function scanStagedFiles(repoPath: string): Finding[] {
    const stagedFiles = getStagedFiles(repoPath);
    const findings: Finding[] = [];

    for (const file of stagedFiles) {
        // Skip binary or unsupported files if needed
        if (isFileBinary(repoPath, file)) { continue; }

        const content = getStagedFileContent(repoPath, file);
        const fileFindings = scanContent(content, file);

        findings.push(...fileFindings);
    }

    return findings;
}

function isFileBinary(repoPath: string, filePath: string): boolean {
    try {
        const content = getStagedFileContent(repoPath, filePath);
        return content.includes("\u0000");
    } catch (e) {
        return false;
    }
}

function getGitRepoPath(cwd: string = process.cwd()): string {
    try {
        // Run the git command to get the top-level directory path
        const gitRootPath = execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
        
        return gitRootPath;
    } catch (error) {
        console.error('Error: Could not determine git repository path.');
        console.error('Details:', (error as Error).message);
        throw new Error('Current directory is not a git repository or git command failed.');
    }
}




