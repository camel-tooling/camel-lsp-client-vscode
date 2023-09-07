import { expect } from 'chai';
import {
    activateTerminalView,
    //deleteFile,
    getJBangVersion,
    initXMLFileWithJBang,
    killTerminalChannel,
    RESOURCES,
    setJBangVersion,
    waitUntilExtensionIsActivated,
    waitUntilTerminalHasText,
} from '../utils/testUtils';
import * as pjson from '../../../package.json';
import {
    ActivityBar,
    EditorView,
    VSBrowser,
    WebDriver
} from 'vscode-uitests-tooling';

let driver: WebDriver;
describe('User preferences', function () {

    beforeEach(async function () {
        this.timeout(40000);
        console.log('beforeEach start - set instance driver');
        driver = VSBrowser.instance.driver;
        console.log('beforeEach - driver done, open resources');
        await VSBrowser.instance.openResources(RESOURCES);
        console.log('beforeEach - resources opened, wait for workbench');
        await VSBrowser.instance.waitForWorkbench();
        console.log('beforeEach - workbench opened, wait till extenison activated');
        await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
        console.log('beforeEach - extension activated, open explorer view');
        await (await new ActivityBar().getViewControl('Explorer')).openView();
        console.log('beforeEach - explorer view opened, beforeEach done');
    });

    describe('JBang version', function () {
        this.timeout(90000);

        let DEFAULT_JBANG: string;

       // const FILENAME = 'test'; // without '.camel.xml' suffix
        const OLDER_JBANG_VERSION = '3.21.0';

        before(async function () {
            console.log('before jbang - delete file from resources for failure prevent');
            //await deleteFile(FILENAME.concat('.camel.xml'), RESOURCES); // prevent failure
            console.log('beforeEach - file deleted, get default jbang version');
            DEFAULT_JBANG = await getJBangVersion();
            console.log('beforeEach - jbang version getted, before done');
        });

        after(async function () {
            console.log('after jbang - start, set default version of jbang');
            await setJBangVersion(DEFAULT_JBANG);
            console.log('after jbang - version setted, after done');
        });

        afterEach(async function () {
            console.log('afterEach jbang - kill terminal channel');
            await killTerminalChannel('Init Camel Route file with JBang');
            console.log('afterEach jbang - terminal killed, close all editors');
            await new EditorView().closeAllEditors();
            console.log('afterEach jbang - all editors closed, delete file');
            //await deleteFile(FILENAME.concat('.camel.xml'), RESOURCES);
            console.log('afterEach jbang - file deleted, afterEach done');
        });

        it('Older version', async function () {
            this.retries(3);
            console.log('Older version test - set Default version of jbang');
            await setJBangVersion(OLDER_JBANG_VERSION);
            console.log('Older version test - version setted');

            console.log('Older version test - init file with jbang');
            await initXMLFileWithJBang(driver, `test_old`);
            console.log('Older version test - file inited');

            console.log('Older version test - wait until termional has text');

            await waitUntilTerminalHasText(driver, `Terminal will be reused by tasks, press any key to close it.`);
            console.log('Older version test - terminal has text, do expect');
            expect(await (await activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${OLDER_JBANG_VERSION}`);
            console.log('Older version test - expect done, test done');
        });

        it('Default version', async function () {
            console.log('Default version test - set Default version of jbang');
            await setJBangVersion(DEFAULT_JBANG);
            console.log('Default version test - version setted');

            console.log('Default version test - init file with jbang');
            await initXMLFileWithJBang(driver, `test_new`);
            console.log('Default version test - file inited');

            console.log('Default version test - wait until termional has text');
            await waitUntilTerminalHasText(driver, `Terminal will be reused by tasks, press any key to close it.`);
            console.log('Default version test - terminal has text, do expect');
            expect(await (await activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${DEFAULT_JBANG}`);
            console.log('Default version test - expect done, test done');
        });

        // nastavím JBANG verzi
        // zkusím vytvoiřít file
        // čekám, než se vytvřoří

    
    });
});