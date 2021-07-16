'use strict';

import { getRedHatService } from '@redhat-developer/vscode-redhat-telemetry/lib';
import * as path from 'path';
import { workspace, ExtensionContext, window, StatusBarAlignment, commands, TextEditor, languages } from 'vscode';
import { LanguageClientOptions, DidChangeConfigurationNotification } from 'vscode-languageclient';
import { LanguageClient, Executable } from 'vscode-languageclient/node';
import { retrieveJavaExecutable } from './JavaManager';

const LANGUAGE_CLIENT_ID = 'LANGUAGE_ID_APACHE_CAMEL';
const SETTINGS_TOP_LEVEL_KEY_CAMEL = 'camel';

export async function activate(context: ExtensionContext) {
	// Let's enable Javadoc symbols autocompletion, shamelessly copied from MIT licensed code at
	// https://github.com/Microsoft/vscode/blob/9d611d4dfd5a4a101b5201b8c9e21af97f06e7a7/extensions/typescript/src/typescriptMain.ts#L186
	languages.setLanguageConfiguration('xml', {
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
	});

	const camelLanguageServerPath = context.asAbsolutePath(path.join('jars','language-server.jar'));
	console.log(camelLanguageServerPath);

	let serverOptions: Executable = {
		command: retrieveJavaExecutable(),
		args: [ '-jar', camelLanguageServerPath]
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: ['xml', 'java', 'groovy', 'kotlin', 'javascript', 'properties', 'quarkus-properties', 'spring-boot-properties', 'yaml'],
		synchronize: {
			configurationSection: ['camel', 'xml', 'java', 'groovy', 'kotlin', 'javascript', 'properties', 'quarkus-properties', 'spring-boot-properties', 'yaml'],
			// Notify the server about file changes to .xml files contain in the workspace
			fileEvents: [
				workspace.createFileSystemWatcher('**/*.xml'),
				workspace.createFileSystemWatcher('**/*.java'),
				workspace.createFileSystemWatcher('**/*.groovy'),
				workspace.createFileSystemWatcher('**/*.kts'),
				workspace.createFileSystemWatcher('**/*.js'),
				workspace.createFileSystemWatcher('**/*.properties'),
				workspace.createFileSystemWatcher('**/*.yaml')
			],
		},
		initializationOptions: {
			settings: getCamelSettings()
		},
		middleware: {
			workspace: {
				didChangeConfiguration: () => {
					languageClient.sendNotification(DidChangeConfigurationNotification.type, { settings: getCamelSettings()});
				}
			}
		}
	};

	let item = window.createStatusBarItem(StatusBarAlignment.Right, Number.MIN_VALUE);
	item.text = 'Starting Apache Camel Language Server...';
	toggleItem(window.activeTextEditor, item);
	// Create the language client and start the client.
	let languageClient = new LanguageClient(LANGUAGE_CLIENT_ID, 'Language Support for Apache Camel', serverOptions, clientOptions);
	languageClient.onReady().then(() => {
		item.text = 'Apache Camel Language Server started';
		toggleItem(window.activeTextEditor, item);
		commands.registerCommand('apache.camel.open.output', ()=>{
		languageClient.outputChannel.show();
	}, error => {console.log(error)});

	window.onDidChangeActiveTextEditor((editor) =>{
		toggleItem(editor, item);
	});

	});
	let disposable = languageClient.start();
	// Push the disposable to the context's subscriptions so that the
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

	const redhatService = await getRedHatService(context);
	const telemetryService = await redhatService.getTelemetryService();
	telemetryService.sendStartupEvent();
}

function getCamelSettings() {
	const camelXMLConfig = workspace.getConfiguration(SETTINGS_TOP_LEVEL_KEY_CAMEL);
	return { [SETTINGS_TOP_LEVEL_KEY_CAMEL] : JSON.parse(JSON.stringify(camelXMLConfig))};
}

function toggleItem(editor: TextEditor, item) {
	if(editor && editor.document &&
		(editor.document.languageId === 'xml' || editor.document.languageId === 'java' || editor.document.languageId === 'groovy')){
		item.show();
	} else{
		item.hide();
	}
}

export function parseVMargs(params:any[], vmargsLine:string) {
	if (!vmargsLine) {
		return;
	}
	let vmargs = vmargsLine.match(/(?:[^\s"]+|"[^"]*")+/g);
	if (vmargs === null) {
		return;
	}
	vmargs.forEach (arg => {
		//remove all standalone double quotes
		arg = arg.replace( /(\\)?"/g, function ($0, $1) { return ($1 ? $0 : ''); });
		//unescape all escaped double quotes
		arg = arg.replace( /(\\)"/g, '"');
		if (params.indexOf(arg) < 0) {
			params.push(arg);
		}
	});
}
