'use strict';

import { TelemetryEvent } from '@redhat-developer/vscode-redhat-telemetry/lib';
import * as path from 'path';
import { workspace, ExtensionContext, window, StatusBarAlignment, commands, TextEditor, languages } from 'vscode';
import { LanguageClientOptions, DidChangeConfigurationNotification } from 'vscode-languageclient';
import { LanguageClient, Executable } from 'vscode-languageclient/node';
import { NewCamelRouteCommand } from './commands/NewCamelRouteCommand';
import { retrieveJavaExecutable } from './requirements/JavaManager';
import * as requirements from './requirements/requirements';
import * as telemetry from './Telemetry';
import { NewCamelQuarkusProjectCommand } from './commands/NewCamelQuarkusProjectCommand';
import { NewCamelSpringBootProjectCommand } from './commands/NewCamelSpringBootProjectCommand';

const LANGUAGE_CLIENT_ID = 'LANGUAGE_ID_APACHE_CAMEL';
const SETTINGS_TOP_LEVEL_KEY_CAMEL = 'camel';

let languageClient: LanguageClient;

const SUPPORTED_LANGUAGE_IDS = ['xml', 'java', 'groovy', 'kotlin', 'javascript', 'properties', 'quarkus-properties', 'spring-boot-properties', 'yaml'];
export async function activate(context: ExtensionContext) {
	// Let's enable Javadoc symbols autocompletion, shamelessly copied from MIT licensed code at
	// https://github.com/Microsoft/vscode/blob/9d611d4dfd5a4a101b5201b8c9e21af97f06e7a7/extensions/typescript/src/typescriptMain.ts#L186
	languages.setLanguageConfiguration('xml', {
		// eslint-disable-next-line
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
	});
	await telemetry.initializeTelemetry(context);

	const camelLanguageServerPath = context.asAbsolutePath(path.join('jars','language-server.jar'));
	console.log(camelLanguageServerPath);

	const requirementsData = await computeRequirementsData(context);

	const serverOptions: Executable = {
		command: retrieveJavaExecutable(requirementsData),
		args: [ '-jar', camelLanguageServerPath]
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
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
				didChangeConfiguration: async () => {
					await languageClient.sendNotification(DidChangeConfigurationNotification.type, { settings: getCamelSettings()});
				}
			}
		}
	};

	const item = window.createStatusBarItem(StatusBarAlignment.Right, Number.MIN_VALUE);
	item.name = 'Camel Language Server'
	item.text = 'Camel LS $(sync~spin)';
	item.tooltip = 'Language Server for Apache Camel is starting...';
	toggleItem(window.activeTextEditor, item);

	// Create the language client and start the client.
	languageClient = new LanguageClient(LANGUAGE_CLIENT_ID, 'Language Support for Apache Camel', serverOptions, clientOptions);
	try {
		await languageClient.start();
		item.text = 'Camel LS $(thumbsup)';
		item.tooltip = 'Language Server for Apache Camel started';
		toggleItem(window.activeTextEditor, item);
		commands.registerCommand('apache.camel.open.output', ()=>{
			languageClient.outputChannel.show();
		});
		languageClient.onTelemetry(async (e: TelemetryEvent) => {
			return (await telemetry.getTelemetryServiceInstance()).send(e);
		});
	} catch(error){
		item.text = 'Camel LS $(thumbsdown)';
		item.tooltip = 'Language Server for Apache Camel failed to start';
		console.log(error)
	}

	window.onDidChangeActiveTextEditor((editor) =>{
		toggleItem(editor, item);
	});

	// Register commands for new Camel Route files - YAML DSL, Java DSL
	context.subscriptions.push(commands.registerCommand(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_YAML, async () => { await new NewCamelRouteCommand('YAML').create(); }));
	context.subscriptions.push(commands.registerCommand(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_JAVA, async () => { await new NewCamelRouteCommand('JAVA').create(); }));
	context.subscriptions.push(commands.registerCommand(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_XML, async () => { await new NewCamelRouteCommand('XML').create(); }));


	context.subscriptions.push(commands.registerCommand(NewCamelQuarkusProjectCommand.ID_COMMAND_CAMEL_QUARKUS_PROJECT, async () => { await new NewCamelQuarkusProjectCommand().create(); }));
	context.subscriptions.push(commands.registerCommand(NewCamelSpringBootProjectCommand.ID_COMMAND_CAMEL_SPRINGBOOT_PROJECT, async () => { await new NewCamelSpringBootProjectCommand().create(); }));

	await (await telemetry.getTelemetryServiceInstance()).sendStartupEvent();
}

export async function deactivate() {
	if (languageClient) {
		await languageClient.stop();
	}
}

async function computeRequirementsData(context: ExtensionContext) {
	try {
		return await requirements.resolveRequirements(context);
	} catch (error) {
		// show error
		const selection = await window.showErrorMessage(error.message, error.label);
		if (error.label && error.label === selection && error.command) {
			await commands.executeCommand(error.command, error.commandParam);
		}
		// rethrow to disrupt the chain.
		throw error;
	}
}

function getCamelSettings() {
	const camelXMLConfig = workspace.getConfiguration(SETTINGS_TOP_LEVEL_KEY_CAMEL);
	return { [SETTINGS_TOP_LEVEL_KEY_CAMEL] : JSON.parse(JSON.stringify(camelXMLConfig))};
}

function toggleItem(editor: TextEditor, item) {
	if(editor?.document && SUPPORTED_LANGUAGE_IDS.includes(editor.document.languageId)){
		item.show();
	} else{
		item.hide();
	}
}

export function parseVMargs(params:any[], vmargsLine:string) {
	if (!vmargsLine) {
		return;
	}
	const vmargs = vmargsLine.match(/(?:[^\s"]+|"[^"]*")+/g);
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
