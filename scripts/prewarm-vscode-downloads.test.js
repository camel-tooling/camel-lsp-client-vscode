'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
	canUseCachedChromeDriver,
	canUseCachedVSCode,
	shouldClearCacheBeforeRetry
} = require('./prewarm-vscode-downloads');

test('does not clear cache for transient HTTP errors', () => {
	const error = new Error('Request failed with status code 502 (Bad Gateway)');
	error.name = 'HTTPError';
	error.code = 'ERR_NON_2XX_3XX_RESPONSE';
	error.response = { statusCode: 502 };

	assert.equal(shouldClearCacheBeforeRetry(error), false);
});

test('does not clear cache for timeout errors', () => {
	const error = new Error('@vscode/test-electron request timeout out after 15000ms');
	error.name = 'TimeoutError';

	assert.equal(shouldClearCacheBeforeRetry(error), false);
});

test('clears cache for local file errors', () => {
	const error = new Error('ENOENT: no such file or directory');
	error.code = 'ENOENT';

	assert.equal(shouldClearCacheBeforeRetry(error), true);
});

test('uses cached pinned VS Code versions without online validation', () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prewarm-vscode-'));
	const executablePath = path.join(tempDir, 'code');

	fs.writeFileSync(executablePath, '');

	const tester = {
		code: {
			executablePath,
			getExistingCodeVersion() {
				return '1.116.0';
			}
		}
	};

	try {
		assert.equal(canUseCachedVSCode(tester, '1.116.0'), true);
		assert.equal(canUseCachedVSCode(tester, 'latest'), false);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test('uses cached chromedriver when it matches the cached chromium version', async () => {
	const tester = {
		code: {
			getChromiumVersionOffline() {
				return '135.0.7011.0';
			}
		},
		chrome: {
			async getLocalDriverVersion() {
				return '135.0.7011.0';
			}
		}
	};

	await assert.doesNotReject(async () => {
		assert.equal(await canUseCachedChromeDriver(tester, '1.116.0'), true);
	});
});
