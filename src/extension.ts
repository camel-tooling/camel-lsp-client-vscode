/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import { TelemetryEvent, TelemetryService } from '@redhat-developer/vscode-redhat-telemetry';
import * as path from 'path';
import { ExtensionContext, StatusBarAlignment, StatusBarItem, TextEditor, Uri, commands, languages, window, workspace } from 'vscode';
import { DidChangeConfigurationNotification, LanguageClientOptions } from 'vscode-languageclient';
import { Executable, LanguageClient } from 'vscode-languageclient/node';
import * as telemetry from './Telemetry';
import { NewCamelFileCommand } from './commands/NewCamelFileCommand';
import { NewCamelKameletCommand } from './commands/NewCamelKameletCommand';
import { NewCamelPipeCommand } from './commands/NewCamelPipeCommand';
import { NewCamelQuarkusProjectCommand } from './commands/NewCamelQuarkusProjectCommand';
import { NewCamelRouteCommand } from './commands/NewCamelRouteCommand';
import { NewCamelRouteFromOpenAPICommand } from './commands/NewCamelRouteFromOpenAPICommand';
import { NewCamelSpringBootProjectCommand } from './commands/NewCamelSpringBootProjectCommand';
import { TransformCamelRouteCommand } from './commands/TransformCamelRouteCommand';
import { TransformCamelRoutesInFolderCommand } from './commands/TransformCamelRoutesInFolderCommand';
import { TransformCamelRoutesInMultipleFilesCommand } from './commands/TransformCamelRoutesInMultipleFilesCommand';
import { retrieveJavaExecutable } from './requirements/JavaManager';
import * as requirements from './requirements/requirements';

const LANGUAGE_CLIENT_ID = 'LANGUAGE_ID_APACHE_CAMEL';
const SETTINGS_TOP_LEVEL_KEY_CAMEL = 'camel';

let languageClient: LanguageClient;

const SUPPORTED_LANGUAGE_IDS = ['xml', 'java', 'groovy', 'kotlin', 'javascript', 'properties', 'quarkus-properties', 'spring-boot-properties', 'yaml', 'json', 'jsonc'];
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

	const requirementsData = await computeRequirementsData();

	const serverOptions: Executable = {
		command: retrieveJavaExecutable(requirementsData),
		args: [ '-jar', camelLanguageServerPath]
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		documentSelector: SUPPORTED_LANGUAGE_IDS,
		synchronize: {
			configurationSection: ['camel', 'xml', 'java', 'groovy', 'kotlin', 'javascript', 'properties', 'quarkus-properties', 'spring-boot-properties', 'yaml', 'jsonc'],
			// Notify the server about file changes to .xml files contain in the workspace
			fileEvents: [
				workspace.createFileSystemWatcher('**/*.xml'),
				workspace.createFileSystemWatcher('**/*.java'),
				workspace.createFileSystemWatcher('**/*.groovy'),
				workspace.createFileSystemWatcher('**/*.kts'),
				workspace.createFileSystemWatcher('**/*.js'),
				workspace.createFileSystemWatcher('**/*.properties'),
				workspace.createFileSystemWatcher('**/*.yaml'),
				workspace.createFileSystemWatcher('**/*.yml'),
				workspace.createFileSystemWatcher('**/tasks.json')
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
	item.name = 'Camel Language Server';
	item.text = 'Camel LS $(sync~spin)';
	item.tooltip = 'Language Server for Apache Camel is starting...';
	if(window.activeTextEditor){
		toggleItem(window.activeTextEditor, item);
	}

	// Create the language client and start the client.
	languageClient = new LanguageClient(LANGUAGE_CLIENT_ID, 'Language Support for Apache Camel', serverOptions, clientOptions);
	try {
		await languageClient.start();
		item.text = 'Camel LS $(thumbsup)';
		item.tooltip = 'Language Server for Apache Camel started';
		if(window.activeTextEditor){
			toggleItem(window.activeTextEditor, item);
		}
		commands.registerCommand('apache.camel.open.output', ()=>{
			languageClient.outputChannel.show();
		});
		languageClient.onTelemetry(async (e: TelemetryEvent) => {
			return (await telemetry.getTelemetryServiceInstance()).send(e);
		});
	} catch(error){
		item.text = 'Camel LS $(thumbsdown)';
		item.tooltip = 'Language Server for Apache Camel failed to start';
		console.log(error);
	}

	window.onDidChangeActiveTextEditor((editor) =>{
		if(editor){
			toggleItem(editor, item);
		}
	});

	// Register commands for new Camel Route files - YAML DSL, Java DSL
	context.subscriptions.push(commands.registerCommand(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_YAML, async (uri :Uri) => {
		await new NewCamelRouteCommand('YAML').create(uri);
		await sendCommandTrackingEvent(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_YAML);
	}));
	context.subscriptions.push(commands.registerCommand(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_JAVA, async (uri :Uri) => {
		await new NewCamelRouteCommand('JAVA').create(uri);
		await sendCommandTrackingEvent(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_JAVA);
	}));
	context.subscriptions.push(commands.registerCommand(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_XML, async (uri :Uri) => {
		await new NewCamelRouteCommand('XML').create(uri);
		await sendCommandTrackingEvent(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_XML);
	}));

	context.subscriptions.push(commands.registerCommand(NewCamelRouteFromOpenAPICommand.ID_COMMAND_CAMEL_ROUTE_FROM_OPEN_API_JBANG_YAML, async () => {
		await new NewCamelRouteFromOpenAPICommand('YAML').create();
		await sendCommandTrackingEvent(NewCamelRouteFromOpenAPICommand.ID_COMMAND_CAMEL_ROUTE_FROM_OPEN_API_JBANG_YAML);
	}));

	context.subscriptions.push(commands.registerCommand(NewCamelKameletCommand.ID_COMMAND_CAMEL_ROUTE_KAMELET_YAML, async () => {
		await new NewCamelKameletCommand('YAML').create();
		await sendCommandTrackingEvent(NewCamelKameletCommand.ID_COMMAND_CAMEL_ROUTE_KAMELET_YAML);
	}));

	context.subscriptions.push(commands.registerCommand(NewCamelPipeCommand.ID_COMMAND_CAMEL_ROUTE_PIPE_YAML, async () => {
		await new NewCamelPipeCommand('YAML').create();
		await sendCommandTrackingEvent(NewCamelPipeCommand.ID_COMMAND_CAMEL_ROUTE_PIPE_YAML);
	}));

	context.subscriptions.push(commands.registerCommand(NewCamelQuarkusProjectCommand.ID_COMMAND_CAMEL_QUARKUS_PROJECT, async () => {
		await new NewCamelQuarkusProjectCommand().create();
		await sendCommandTrackingEvent(NewCamelQuarkusProjectCommand.ID_COMMAND_CAMEL_QUARKUS_PROJECT);
	}));
	context.subscriptions.push(commands.registerCommand(NewCamelSpringBootProjectCommand.ID_COMMAND_CAMEL_SPRINGBOOT_PROJECT, async () => {
		await new NewCamelSpringBootProjectCommand().create();
		await sendCommandTrackingEvent(NewCamelSpringBootProjectCommand.ID_COMMAND_CAMEL_SPRINGBOOT_PROJECT);
	}));
	context.subscriptions.push(commands.registerCommand(TransformCamelRouteCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_YAML, async () => {
		await new TransformCamelRouteCommand('YAML').create();
		await sendCommandTrackingEvent(TransformCamelRouteCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_YAML);
	}));
	context.subscriptions.push(commands.registerCommand(TransformCamelRouteCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_XML, async () => {
		await new TransformCamelRouteCommand('XML').create();
		await sendCommandTrackingEvent(TransformCamelRouteCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_XML);
	}));
	context.subscriptions.push(commands.registerCommand(TransformCamelRoutesInFolderCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_FOLDER_TO_YAML, async () => {
		await new TransformCamelRoutesInFolderCommand('YAML').create();
		await sendCommandTrackingEvent(TransformCamelRoutesInFolderCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_FOLDER_TO_YAML);
	}));
	context.subscriptions.push(commands.registerCommand(TransformCamelRoutesInFolderCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_FOLDER_TO_XML, async () => {
		await new TransformCamelRoutesInFolderCommand('XML').create();
		await sendCommandTrackingEvent(TransformCamelRoutesInFolderCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_FOLDER_TO_XML);
	}));
	context.subscriptions.push(commands.registerCommand(TransformCamelRoutesInMultipleFilesCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_MULTIPLES_FILES_TO_YAML, async () => {
		await new TransformCamelRoutesInMultipleFilesCommand('YAML').create();
		await sendCommandTrackingEvent(TransformCamelRoutesInMultipleFilesCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_MULTIPLES_FILES_TO_YAML);
	}));
	context.subscriptions.push(commands.registerCommand(TransformCamelRoutesInMultipleFilesCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_MULTIPLES_FILES_TO_XML, async () => {
		await new TransformCamelRoutesInMultipleFilesCommand('XML').create();
		await sendCommandTrackingEvent(TransformCamelRoutesInMultipleFilesCommand.ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_MULTIPLES_FILES_TO_XML);
	}));
	context.subscriptions.push(commands.registerCommand(NewCamelFileCommand.ID_COMMAND_CAMEL_NEW_FILE, async (uri :Uri) => {
		await new NewCamelFileCommand().create(uri);
		await sendCommandTrackingEvent(NewCamelFileCommand.ID_COMMAND_CAMEL_NEW_FILE);
	}));

	await (await telemetry.getTelemetryServiceInstance()).sendStartupEvent();
}

export async function deactivate() {
	if (languageClient) {
		await languageClient.stop();
	}
}

async function computeRequirementsData() {
	try {
		return await requirements.resolveRequirements();
	} catch (error : any) {
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

function toggleItem(editor: TextEditor, item: StatusBarItem) {
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

async function sendCommandTrackingEvent(commandId: string) {
	const telemetryEvent: TelemetryEvent = {
		type: 'track',
		name: 'command',
		properties: {
			identifier: commandId
		}
	};
	const telemetryService :TelemetryService = await telemetry.getTelemetryServiceInstance();
	await telemetryService.send(telemetryEvent);
}
