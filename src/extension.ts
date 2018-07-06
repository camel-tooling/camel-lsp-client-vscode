'use strict';

import * as path from 'path';
import { workspace, ExtensionContext, window, StatusBarAlignment, commands, ViewColumn, TextEditor, languages } from 'vscode';
import { LanguageClient, LanguageClientOptions, Executable } from 'vscode-languageclient';

var os = require('os');
var storagePath;

const LANGUAGE_CLIENT_ID = 'LANGUAGE_ID_APACHE_CAMEL';

export function activate(context: ExtensionContext) {
	// Let's enable Javadoc symbols autocompletion, shamelessly copied from MIT licensed code at
	// https://github.com/Microsoft/vscode/blob/9d611d4dfd5a4a101b5201b8c9e21af97f06e7a7/extensions/typescript/src/typescriptMain.ts#L186
	languages.setLanguageConfiguration('xml', {
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
	});

	storagePath = context.storagePath;
	if (!storagePath) {
		storagePath = getTempWorkspace();
	}

	var path = require('path');
	var camelLanguageServerPath = context.asAbsolutePath(path.join('jars','language-server.jar'));
	console.log(camelLanguageServerPath);

	let serverOptions: Executable = {
		command: 'java',
		args: [ '-jar', camelLanguageServerPath],
		options: {stdio:'pipe'}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for xml
		documentSelector: ['xml', 'java'],
		synchronize: {
			configurationSection: ['xml', 'java'],
			// Notify the server about file changes to .xml files contain in the workspace
			fileEvents: [
				workspace.createFileSystemWatcher('**/*.xml'),
				workspace.createFileSystemWatcher('**/*.java')
			],
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
		commands.registerCommand('java.open.output', ()=>{
		languageClient.outputChannel.show(ViewColumn.Three);
	});

	window.onDidChangeActiveTextEditor((editor) =>{
		toggleItem(editor, item);
	});
});
	let disposable = languageClient.start();
	// Push the disposable to the context's subscriptions so that the
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);
}

function toggleItem(editor: TextEditor, item) {
	if(editor && editor.document &&
		(editor.document.languageId === 'xml' || editor.document.languageId === 'java')){
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

function getTempWorkspace() {
	return path.resolve(os.tmpdir(),'vscodesws_'+makeRandomHexString(5));
}

function makeRandomHexString(length) {
    var chars = ['0', '1', '2', '3', '4', '5', '6', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    var result = '';
    for (var i = 0; i < length; i++) {
        var idx = Math.floor(chars.length * Math.random());
        result += chars[idx];
    }
    return result;
}
