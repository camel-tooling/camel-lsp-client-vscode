'use strict';

/* Mostly duplicated from VS Code Java */
import {  workspace } from 'vscode';

export async function checkJavaPreferences() {
	const javaHome = workspace.getConfiguration().inspect<string>('camel.ls.java.home').workspaceValue;
	if (javaHome !== null && javaHome !== undefined) {
		return javaHome;
	} else {
		return workspace.getConfiguration().inspect<string>('camel.ls.java.home').globalValue;
	}
}
