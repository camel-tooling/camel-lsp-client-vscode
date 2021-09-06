'use strict';

/* Mostly duplicated from VS Code Java */

import { workspace, WorkspaceConfiguration } from 'vscode';

export function getJavaConfiguration(): WorkspaceConfiguration {
	return workspace.getConfiguration('java');
}
