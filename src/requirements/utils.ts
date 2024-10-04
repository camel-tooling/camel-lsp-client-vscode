'use strict';

/* Mostly duplicated from VS Code Java */
import path from 'path';
import { workspace, WorkspaceConfiguration } from 'vscode';

export function getJavaConfiguration(): WorkspaceConfiguration {
	return workspace.getConfiguration('java');
}

/**
 * If there are any folder in the current workspace gets the path to the first one.
 *
 * @returns string represent the fsPath of the first folder in the current opened workspace, undefined otherwise.
 */
export function getCurrentWorkingDirectory(): string | undefined {
	const workspaceFolders = workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		// Return the first workspace folder
		return workspaceFolders[0].uri.fsPath;
	}
	return undefined;
}

/**
 * Compare two given paths to see if they are equal. Normalizes the string and takes into acount case sentive OSes.
 *
 * @param path1 string representing the first path to be compared
 * @param path2 string representing t,he second path to be compared
 * @returns `true` if paths are equal `false` otherwise.
 */
export function arePathsEqual(path1: string, path2: string): boolean {
	// Normalize both paths
	const normalizedPath1 = path.normalize(path1);
	const normalizedPath2 = path.normalize(path2);

	// On Windows and macOS, perform case-insensitive comparison
	if (process.platform === 'win32' || process.platform === 'darwin') {
		return normalizedPath1.toLowerCase() === normalizedPath2.toLowerCase();
	}

	// On Linux (and other case-sensitive systems), compare as-is
	return normalizedPath1 === normalizedPath2;
}
