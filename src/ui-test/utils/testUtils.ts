import { ContentAssistItem, EditorView, InputBox, ModalDialog, ProblemsView, TextEditor, Workbench } from "vscode-extension-tester";

export async function openFile(fileToOpenAbsolutePath?: string): Promise<void> {
	const workbench = new Workbench();
	await workbench.executeCommand('File: Open...');
	await workbench.openCommandPrompt();
	const input = await InputBox.create();
	await input.setText(fileToOpenAbsolutePath);
	await input.confirm();
}

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
	if(dirty) {
		const dialog = new ModalDialog();
		if(save) {
			await dialog.pushButton('Save');
		} else {
			await dialog.pushButton('Don\'t Save');
		}
	}
}
