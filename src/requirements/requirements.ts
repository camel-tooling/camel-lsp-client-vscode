'use strict';

/* Mostly duplicated from VS Code Java */

import { Uri, env } from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as expandHomeDir from 'expand-home-dir';
import { Commands } from './commands';
import { checkJavaPreferences } from './settings';
import { findJavaHomes, getJavaVersion, JavaRuntime } from './findJavaRuntimes';

const isWindows = process.platform.indexOf('win') === 0;
const JAVA_FILENAME = 'java' + (isWindows ? '.exe' : '');
const REQUIRED_JRE_VERSION = 17;
export interface RequirementsData {
    java_home: string;
    java_version: number;
}

/**
 * Resolves the requirements needed to run the extension.
 * Returns a promise that will resolve to a RequirementsData if
 * all requirements are resolved, it will reject with ErrorData if
 * if any of the requirements fails to resolve.
 *
 */
export async function resolveRequirements(): Promise<RequirementsData> {
    return new Promise(async function (resolve, reject) {
        let source: string;
        let javaVersion = 0;
        let javaHome = await checkJavaPreferences();
        if (javaHome) {
            // java.home explictly specified
            source = `java.home variable defined in ${env.appName} settings`;
            javaHome = expandHomeDir(javaHome);
            if (!await fse.pathExists(javaHome)) {
                invalidJavaHome(reject, `The ${source} points to a missing or inaccessible folder (${javaHome})`);
            } else if (!await fse.pathExists(path.resolve(javaHome, 'bin', JAVA_FILENAME))) {
                let msg: string;
                if (await fse.pathExists(path.resolve(javaHome, JAVA_FILENAME))) {
                    msg = `'bin' should be removed from the ${source} (${javaHome})`;
                } else {
                    msg = `The ${source} (${javaHome}) does not point to a JRE.`;
                }
                invalidJavaHome(reject, msg);
            }
            javaVersion = await getJavaVersion(javaHome);
        } else {
            // java.home not specified, search valid REs from env.JAVA_HOME, env.PATH, Registry(Window), Common directories
            const javaRuntimes = await findJavaHomes();
            const validJres = javaRuntimes.filter(r => r.version >= REQUIRED_JRE_VERSION);
            if (validJres.length > 0) {
                sortJdksBySource(validJres);
                javaHome = validJres[0].home;
                javaVersion = validJres[0].version;
            }
        }

        if (javaVersion < REQUIRED_JRE_VERSION) {
            openJDKDownload(reject, `Java ${REQUIRED_JRE_VERSION} or more recent is required to run the Language Support for Camel extension. Please download and install a recent JDK. You can still compile your projects with older JDKs by configuring ['java.configuration.runtimes'](https://github.com/redhat-developer/vscode-java/wiki/JDK-Requirements#java.configuration.runtimes)`);
        }

        resolve({ java_home: javaHome, java_version: javaVersion });
    });
}

function sortJdksBySource(jdks: JavaRuntime[]) {
    const rankedJres = jdks as Array<JavaRuntime & { rank: number }>;
    const sources = ['env.JDK_HOME', 'env.JAVA_HOME', 'env.PATH'];
    for (const [index, source] of sources.entries()) {
        for (const jre of rankedJres) {
            if (jre.rank === undefined && jre.sources.includes(source)) {
                jre.rank = index;
            }
        }
    }
    rankedJres.filter(jre => jre.rank === undefined).forEach(jre => jre.rank = sources.length);
    rankedJres.sort((a, b) => a.rank - b.rank);
}

export function parseMajorVersion(version: string): number {
    if (!version) {
        return 0;
    }
    // Ignore '1.' prefix for legacy Java versions
    if (version.startsWith('1.')) {
        version = version.substring(2);
    }
    // look into the interesting bits now
    const regexp = /\d+/g;
    const match = regexp.exec(version);
    let javaVersion = 0;
    if (match) {
        javaVersion = parseInt(match[0]);
    }
    return javaVersion;
}

function openJDKDownload(reject, cause) {
    const jdkUrl = getJdkUrl();
    reject({
        message: cause,
        label: 'Get the Java Development Kit',
        command: Commands.OPEN_BROWSER,
        commandParam: Uri.parse(jdkUrl),
    });
}

function getJdkUrl() {
    let jdkUrl = 'https://developers.redhat.com/products/openjdk/download/?sc_cid=701f2000000RWTnAAO';
    if (process.platform === 'darwin') {
        jdkUrl = 'https://adoptopenjdk.net/';
    }
    return jdkUrl;
}

function invalidJavaHome(reject, cause: string) {
    if (cause.indexOf('java.home') > -1) {
        reject({
            message: cause,
            label: 'Open settings',
            command: Commands.OPEN_JSON_SETTINGS
        });
    } else {
        reject({
            message: cause,
        });
    }
}
