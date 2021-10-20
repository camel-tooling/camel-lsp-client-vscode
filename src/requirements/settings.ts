'use strict';

/* Mostly duplicated from VS Code Java */

import * as path from 'path';
import { window, workspace, ConfigurationTarget, env, ExtensionContext } from 'vscode';
import { getJavaConfiguration } from './utils';

export const IS_WORKSPACE_JDK_ALLOWED = 'java.ls.isJdkAllowed';
export const IS_WORKSPACE_VMARGS_ALLOWED = 'java.ls.isVmargsAllowed';


export async function checkJavaPreferences(context: ExtensionContext) {
	const allow = 'Allow';
	const disallow = 'Disallow';
	let javaHome = workspace.getConfiguration().inspect<string>('java.home').workspaceValue;
	let isVerified = javaHome === undefined || javaHome === null;
	if (isVerified) {
		javaHome = getJavaConfiguration().get('home');
	}
	const key = getKey(IS_WORKSPACE_JDK_ALLOWED, context.storagePath, javaHome);
	const globalState = context.globalState;
	if (!isVerified) {
		isVerified = globalState.get(key);
		if (isVerified === undefined) {
			await window.showErrorMessage(`Security Warning! Do you allow this workspace to set the java.home variable? \n java.home: ${javaHome}`, disallow, allow).then(async selection => {
				if (selection === allow) {
					globalState.update(key, true);
				} else if (selection === disallow) {
					globalState.update(key, false);
					await workspace.getConfiguration().update('java.home', undefined, ConfigurationTarget.Workspace);
				}
			});
			isVerified = globalState.get(key);
		}
	}
	const vmargs = workspace.getConfiguration().inspect('java.jdt.ls.vmargs').workspaceValue;
	if (vmargs !== undefined) {
		const agentFlag = getJavaagentFlag(vmargs);
		if (agentFlag !== null) {
			const keyVmargs = getKey(IS_WORKSPACE_VMARGS_ALLOWED, context.storagePath, vmargs);
			const vmargsVerified = globalState.get(keyVmargs);
			if (vmargsVerified === undefined || vmargsVerified === null) {
				await window.showErrorMessage(`Security Warning! The java.jdt.ls.vmargs variable defined in ${env.appName} settings includes the (${agentFlag}) javagent preference. Do you allow it to be used?`, disallow, allow).then(async selection => {
					if (selection === allow) {
						globalState.update(keyVmargs, true);
					} else if (selection === disallow) {
						globalState.update(keyVmargs, false);
						await workspace.getConfiguration().update('java.jdt.ls.vmargs', undefined, ConfigurationTarget.Workspace);
					}
				});
			}
		}
	}
	if (isVerified) {
		return javaHome;
	} else {
		return workspace.getConfiguration().inspect<string>('java.home').globalValue;
	}
}

export function getKey(prefix, storagePath, value) {
	const workspacePath = path.resolve(storagePath + '/jdt_ws');
	if (workspace.name !== undefined) {
		return `${prefix}::${workspacePath}::${value}`;
	}
	else {
		return `${prefix}::${value}`;
	}
}

export function getJavaagentFlag(vmargs) {
	const javaagent = '-javaagent:';
	const args = vmargs.split(' ');
	let agentFlag = null;
	for (const arg of args) {
		if (arg.startsWith(javaagent)) {
			agentFlag = arg.substring(javaagent.length);
			break;
		}
	}
	return agentFlag;
}
