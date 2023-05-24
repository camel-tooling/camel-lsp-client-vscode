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

import {
	ContentAssistItem,
	EditorView,
	InputBox,
	ModalDialog,
	ProblemsView,
	TextEditor,
	Workbench
} from "vscode-uitests-tooling";

/**
 * Workaround for issue with ContentAssistItem getText() method
 * For more details please see https://github.com/djelinek/vscode-uitests-tooling/issues/17
 *
 * @param item ContenAssistItem
 */
export async function getTextExt(item: ContentAssistItem): Promise<string> {
	const name: string = await item.getText();
	return name.split('\n')[0];
}

/**
 * Workaround the issue of BottomBarPanel().openProblemsView() method
 * For more details see https://github.com/redhat-developer/vscode-extension-tester/issues/505
 *
 * @param view Label of BottomBar View
 */
export async function openView(view: string): Promise<ProblemsView> {
	const workbench = new Workbench();
	await workbench.executeCommand('View: Open View');
	await workbench.openCommandPrompt();
	const input = await InputBox.create();
	await input.setText('view ' + view);
	await input.confirm();
	return new ProblemsView();
}

/**
 * Close editor with handling of Save/Don't Save Modal dialog
 *
 * @param title Title of opened active editor
 * @param save true/false
 */
export async function closeEditor(title: string, save?: boolean) {
	const dirty = await new TextEditor().isDirty();
	await new EditorView().closeEditor(title);
	if (dirty) {
		const dialog = new ModalDialog();
		if (save) {
			await dialog.pushButton('Save');
		} else {
			await dialog.pushButton('Don\'t Save');
		}
	}
}

/**
 * Switch to an editor tab with the given title
 *
 * @param title Title of editor to activate
 */
export async function activateEditor(title: string): Promise<TextEditor> {
	return await new EditorView().openEditor(title) as TextEditor;
}

/**
 * Wait until cursor is set to defined position inside Text Editor
 *
 * @param line
 * @param column
 */
export async function waitUntilCursorAtPosition(line: number, column: number): Promise<void> {
	const editor = new TextEditor();
	await editor.getDriver().wait(async function () {
		const coor = await editor.getCoordinates();
		return coor[0] === line && coor[1] === column;
	});
}

/**
 * Type text at defined position inside Text Editor
 * Workaround for https://github.com/redhat-developer/vscode-extension-tester/issues/795
 *
 * @param line
 * @param column
 * @param text
 */
export async function typeTextAtExt(line: number, column: number, text: string): Promise<void> {
	const input = await new Workbench().openCommandPrompt();
	await input.setText(`:${line},${column}`);
	await input.confirm();
	await waitUntilCursorAtPosition(line, column);

	await new TextEditor().typeText(text);
	await waitUntilCursorAtPosition(line, column + text.length);
}
