'use strict';

import { getRedHatService, TelemetryEvent} from '@redhat-developer/vscode-redhat-telemetry/lib';
import * as path from 'path';
import { workspace, ExtensionContext, window, StatusBarAlignment, commands, TextEditor, languages } from 'vscode';
import { LanguageClientOptions, DidChangeConfigurationNotification } from 'vscode-languageclient';
import { LanguageClient, Executable } from 'vscode-languageclient/node';
import { retrieveJavaExecutable } from './JavaManager';
import * as requirements from './requirements';

const LANGUAGE_CLIENT_ID = 'LANGUAGE_ID_APACHE_CAMEL';
const SETTINGS_TOP_LEVEL_KEY_CAMEL = 'camel';
export let extensionContext: ExtensionContext;

const SUPPORTED_LANGUAGE_IDS = ['xml', 'java', 'groovy', 'kotlin', 'javascript', 'properties', 'quarkus-properties', 'spring-boot-properties', 'yaml'];
export async function activate(context: ExtensionContext) {
	extensionContext = context;
	// Let's enable Javadoc symbols autocompletion, shamelessly copied from MIT licensed code at
	// https://github.com/Microsoft/vscode/blob/9d611d4dfd5a4a101b5201b8c9e21af97f06e7a7/extensions/typescript/src/typescriptMain.ts#L186
	languages.setLanguageConfiguration('xml', {
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
	});

	const camelLanguageServerPath = context.asAbsolutePath(path.join('jars','language-server.jar'));
	console.log(camelLanguageServerPath);

	const requirementsData = await computeRequirementsData(context);

	let serverOptions: Executable = {
		command: retrieveJavaExecutable(requirementsData),
		args: [ '-jar', camelLanguageServerPath]
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: SUPPORTED_LANGUAGE_IDS,
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
	item.name = 'Camel Language Server'
	item.text = 'Camel LS $(sync~spin)';
	item.tooltip = 'Language Server for Apache Camel is starting...';
	toggleItem(window.activeTextEditor, item);

	// Create the language client and start the client.
	let languageClient = new LanguageClient(LANGUAGE_CLIENT_ID, 'Language Support for Apache Camel', serverOptions, clientOptions);
	languageClient.onReady().then(() => {
		item.text = 'Camel LS $(thumbsup)';
		item.tooltip = 'Language Server for Apache Camel started';
		toggleItem(window.activeTextEditor, item);
		commands.registerCommand('apache.camel.open.output', ()=>{
		languageClient.outputChannel.show();
	}, error => {
		item.text = 'Camel LS $(thumbsdown)';
		item.tooltip = 'Language Server for Apache Camel failed to start';
		console.log(error)
	});

	window.onDidChangeActiveTextEditor((editor) =>{
		toggleItem(editor, item);
	});

	});

	const redhatService = await getRedHatService(context);
	const telemetryService = await redhatService.getTelemetryService();
	telemetryService.sendStartupEvent();
	languageClient.onTelemetry(async (e: TelemetryEvent) => {
		return telemetryService.send(e);
	});

	let disposable = languageClient.start();
	// Push the disposable to the context's subscriptions so that the
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

}

export async function computeRequirementsData(context: ExtensionContext) {
	let requirementsData;
	try {
		requirementsData = await requirements.resolveRequirements(context);
	} catch (error) {
		// show error
		const selection = await window.showErrorMessage(error.message, error.label);
		if (error.label && error.label === selection && error.command) {
			commands.executeCommand(error.command, error.commandParam);
		}
		// rethrow to disrupt the chain.
		throw error;
	}
	return requirementsData;
}

function getCamelSettings() {
	const camelXMLConfig = workspace.getConfiguration(SETTINGS_TOP_LEVEL_KEY_CAMEL);
	return { [SETTINGS_TOP_LEVEL_KEY_CAMEL] : JSON.parse(JSON.stringify(camelXMLConfig))};
}

function toggleItem(editor: TextEditor, item) {
	if(editor && editor.document && SUPPORTED_LANGUAGE_IDS.includes(editor.document.languageId)){
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
