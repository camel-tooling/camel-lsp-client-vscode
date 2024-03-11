'use strict';

/* Mostly duplicated from VS Code Java */
import {  workspace } from 'vscode';

export async function checkJavaPreferences() {

	const placeholder = workspace.getConfiguration().inspect<string>('camel.ls.java.home');

	if (placeholder !== undefined) {
		const javaHome = placeholder.workspaceValue;
		if (javaHome !== undefined && javaHome !== null) {
			return javaHome;
		} else {
			return placeholder.globalValue;
		}
	}
}
