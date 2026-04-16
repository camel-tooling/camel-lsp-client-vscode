'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { downloadAndUnzipVSCode } = require('@vscode/test-electron');
const { ExTester, ReleaseQuality, loadCodeVersion } = require('vscode-extension-tester');

function resolveStorageFolder() {
	return process.env.TEST_RESOURCES ? path.resolve(process.env.TEST_RESOURCES) : path.join(os.tmpdir(), 'test-resources');
}

function resolveTestElectronVersion() {
	const version = process.env.CODE_VERSION;

	if (version === undefined || version === 'max') {
		return 'stable';
	} else if (version === 'latest') {
		return 'insiders';
	}
	return version;
}

function resolveReleaseType() {
	return process.env.CODE_TYPE === 'insider' ? ReleaseQuality.Insider : ReleaseQuality.Stable;
}

function clearCacheEntries(folder, matcher) {
	if (!fs.existsSync(folder)) {
		return;
	}

	for (const entry of fs.readdirSync(folder)) {
		if (matcher(entry)) {
			fs.rmSync(path.join(folder, entry), { recursive: true, force: true });
		}
	}
}

function clearTestElectronCache() {
	clearCacheEntries(path.resolve('.vscode-test'), (entry) => entry.startsWith('vscode-'));
}

function clearExTesterCache(storageFolder) {
	clearCacheEntries(storageFolder, (entry) => {
		return entry === 'Visual Studio Code.app'
			|| entry === 'Visual Studio Code - Insiders.app'
			|| entry === 'driverVersion'
			|| entry.startsWith('VSCode-')
			|| entry.startsWith('chromedriver')
			|| entry.endsWith('.zip')
			|| entry.endsWith('.tar.gz');
	});
}

function getErrorSignature(error) {
	const parts = [];
	const seen = new Set();
	let current = error;

	while (current && typeof current === 'object' && !seen.has(current)) {
		seen.add(current);
		if (current.name) {
			parts.push(String(current.name));
		}
		if (current.code) {
			parts.push(String(current.code));
		}
		if (current.message) {
			parts.push(String(current.message));
		}
		if (current.statusCode) {
			parts.push(String(current.statusCode));
		}
		if (current.response && current.response.statusCode) {
			parts.push(String(current.response.statusCode));
		}
		current = current.cause;
	}

	return parts.join('\n').toLowerCase();
}

function shouldClearCacheBeforeRetry(error) {
	const signature = getErrorSignature(error);
	const transientNetworkMarkers = [
		'etimedout',
		'econnreset',
		'econnrefused',
		'enotfound',
		'enetunreach',
		'eai_again',
		'err_non_2xx_3xx_response',
		'request timeout out after',
		'bad gateway',
		'failed to get json',
		'socket hang up',
		' 408',
		' 429',
		' 500',
		' 502',
		' 503',
		' 504',
		' 521',
		' 522',
		' 524'
	];

	return !transientNetworkMarkers.some((marker) => signature.includes(marker));
}

function canUseCachedVSCode(tester, codeVersion) {
	const literalVersion = loadCodeVersion(codeVersion);

	if (literalVersion === 'latest') {
		return false;
	}

	if (!fs.existsSync(tester.code.executablePath)) {
		return false;
	}

	try {
		return tester.code.getExistingCodeVersion() === literalVersion;
	} catch {
		return false;
	}
}

async function getCachedChromiumVersion(tester, codeVersion) {
	const literalVersion = loadCodeVersion(codeVersion);

	if (literalVersion === 'latest') {
		return undefined;
	}

	try {
		return tester.code.getChromiumVersionOffline();
	} catch {
		return undefined;
	}
}

async function canUseCachedChromeDriver(tester, codeVersion) {
	const chromiumVersion = await getCachedChromiumVersion(tester, codeVersion);

	if (!chromiumVersion) {
		return false;
	}

	try {
		const localDriverVersion = await tester.chrome.getLocalDriverVersion(chromiumVersion);
		return localDriverVersion.startsWith(chromiumVersion);
	} catch {
		return false;
	}
}

async function retryWithFreshCache(label, clearCache, action) {
	try {
		await action();
	} catch (error) {
		const clearCacheBeforeRetry = shouldClearCacheBeforeRetry(error);
		console.warn(`${label} cache recovery triggered${clearCacheBeforeRetry ? ', clearing cache before retry' : ', retrying without clearing cache'}`, error);
		if (clearCacheBeforeRetry) {
			clearCache();
		}
		await action();
	}
}

async function main() {
	const storageFolder = resolveStorageFolder();
	const codeVersion = process.env.CODE_VERSION ?? 'max';

	console.log(`Prewarming @vscode/test-electron cache for ${resolveTestElectronVersion()}`);
	await retryWithFreshCache('@vscode/test-electron', clearTestElectronCache, async () => {
		await downloadAndUnzipVSCode({
			version: resolveTestElectronVersion(),
			cachePath: path.resolve('.vscode-test')
		});
	});

	console.log(`Prewarming vscode-extension-tester cache for ${codeVersion} / ${process.env.CODE_TYPE ?? 'stable'}`);
	const tester = new ExTester(storageFolder, resolveReleaseType());
	if (canUseCachedVSCode(tester, codeVersion)) {
		console.log(`Pinned VS Code ${loadCodeVersion(codeVersion)} already exists in vscode-extension-tester cache, skipping download`);
	} else {
		await retryWithFreshCache('vscode-extension-tester code', () => clearExTesterCache(storageFolder), async () => {
			await tester.downloadCode(codeVersion);
		});
	}
	if (await canUseCachedChromeDriver(tester, codeVersion)) {
		console.log('Matching ChromeDriver already exists in vscode-extension-tester cache, skipping download');
	} else {
		await retryWithFreshCache('vscode-extension-tester chromedriver', () => clearExTesterCache(storageFolder), async () => {
			await tester.downloadChromeDriver(codeVersion);
		});
	}
}

module.exports = {
	canUseCachedChromeDriver,
	canUseCachedVSCode,
	getErrorSignature,
	getCachedChromiumVersion,
	shouldClearCacheBeforeRetry
};

if (require.main === module) {
	main().catch((error) => {
		console.error('Failed to prewarm VS Code download cache', error);
		process.exit(1);
	});
}
