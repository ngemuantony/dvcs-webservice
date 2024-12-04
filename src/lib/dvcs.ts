import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const REPOS_DIR = process.env.REPOS_DIR || path.join(process.cwd(), 'repositories');
const DVCS_PATH = process.env.DVCS_PATH || 'dvcs'; // Path to your DVCS executable

export class DVCSError extends Error {
  constructor(message: string, public stderr?: string) {
    super(message);
    this.name = 'DVCSError';
  }
}

export async function initRepository(repoPath: string): Promise<void> {
  try {
    // Ensure the repository directory exists
    await fs.mkdir(repoPath, { recursive: true });

    // Initialize the repository
    await execAsync(`${DVCS_PATH} init`, { cwd: repoPath });
  } catch (error: any) {
    console.error('Repository initialization error:', error);
    throw new DVCSError('Failed to initialize repository', error.stderr);
  }
}

export async function cloneRepository(sourceRepo: string, targetRepo: string): Promise<void> {
  try {
    await execAsync(`${DVCS_PATH} clone ${sourceRepo} ${targetRepo}`);
  } catch (error: any) {
    throw new DVCSError('Failed to clone repository', error.stderr);
  }
}

export async function getRepositoryStatus(repoPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`${DVCS_PATH} status`, { cwd: repoPath });
    return stdout;
  } catch (error: any) {
    throw new DVCSError('Failed to get repository status', error.stderr);
  }
}

export async function getBranchList(repoPath: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`${DVCS_PATH} branch`, { cwd: repoPath });
    return stdout.split('\n').filter(Boolean).map(branch => branch.trim());
  } catch (error: any) {
    throw new DVCSError('Failed to list branches', error.stderr);
  }
}

export async function getCommitHistory(repoPath: string): Promise<any[]> {
  try {
    const { stdout } = await execAsync(`${DVCS_PATH} log --json`, { cwd: repoPath });
    return JSON.parse(stdout);
  } catch (error: any) {
    throw new DVCSError('Failed to get commit history', error.stderr);
  }
}

export async function createBranch(repoPath: string, branchName: string): Promise<void> {
  try {
    await execAsync(`${DVCS_PATH} branch ${branchName}`, { cwd: repoPath });
  } catch (error: any) {
    throw new DVCSError('Failed to create branch', error.stderr);
  }
}

export async function checkoutBranch(repoPath: string, branchName: string): Promise<void> {
  try {
    await execAsync(`${DVCS_PATH} checkout ${branchName}`, { cwd: repoPath });
  } catch (error: any) {
    throw new DVCSError('Failed to checkout branch', error.stderr);
  }
}

export async function getFileContents(repoPath: string, filePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`${DVCS_PATH} show HEAD:${filePath}`, { cwd: repoPath });
    return stdout;
  } catch (error: any) {
    throw new DVCSError('Failed to get file contents', error.stderr);
  }
}

export async function getFileDiff(repoPath: string, filePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`${DVCS_PATH} diff ${filePath}`, { cwd: repoPath });
    return stdout;
  } catch (error: any) {
    throw new DVCSError('Failed to get file diff', error.stderr);
  }
}

export async function commitChanges(repoPath: string, message: string): Promise<void> {
  try {
    await execAsync(`${DVCS_PATH} commit -m "${message}"`, { cwd: repoPath });
  } catch (error: any) {
    throw new DVCSError('Failed to commit changes', error.stderr);
  }
}

export async function pushChanges(repoPath: string, remote: string = 'origin', branch: string = 'main'): Promise<void> {
  try {
    await execAsync(`${DVCS_PATH} push ${remote} ${branch}`, { cwd: repoPath });
  } catch (error: any) {
    throw new DVCSError('Failed to push changes', error.stderr);
  }
}

export async function pullChanges(repoPath: string, remote: string = 'origin', branch: string = 'main'): Promise<void> {
  try {
    await execAsync(`${DVCS_PATH} pull ${remote} ${branch}`, { cwd: repoPath });
  } catch (error: any) {
    throw new DVCSError('Failed to pull changes', error.stderr);
  }
}
