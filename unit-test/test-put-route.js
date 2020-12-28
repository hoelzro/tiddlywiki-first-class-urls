const DEBUG = false;

const TIDDLYWIKI_PORT  = 40001;
const MOCK_SERVER_PORT = 40002;

const assert       = require('assert');
const childProcess = require('child_process');
const fs           = require('fs');
const http         = require('http');
const os           = require('os');
const path         = require('path');
const process      = require('process');

const TimeoutError = new Error('timeout');

function dumpChildOutput(label, data) {
    if(!DEBUG) {
        return;
    }

    // XXX print as TAP output or something?
    let lines = data.toString().split('\n');
    for(let line of lines) {
        console.log(`${label}> ${line}`);
    }
}

let wikiDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-first-class-url-tests-'));

childProcess.spawnSync('npx', ['tiddlywiki', wikiDir, '--init', 'server']);

let twServer = childProcess.spawn('npx', ['tiddlywiki', '++' + process.cwd(), wikiDir, '--listen', 'port=' + TIDDLYWIKI_PORT]);

twServer.on('close', (code) => {
    // XXX exit non-zero if code != 0?
    console.log(`tiddlywiki exited with code ${code}`);
});

twServer.stdout.on('data', (data) => {
    dumpChildOutput('tw out', data);
});

twServer.stderr.on('data', (data) => {
    dumpChildOutput('tw err', data);
});

let mockServer = childProcess.spawn('node', ['unit-test/mock-server.js', MOCK_SERVER_PORT.toString()]);

mockServer.on('close', (code) => {
    // XXX exit non-zero if code != 0?
    console.log(`mock server exited with code ${code}`);
});

mockServer.stdout.on('data', (data) => {
    dumpChildOutput('mock out', data);
});

mockServer.stderr.on('data', (data) => {
    dumpChildOutput('mock err', data);
});

process.on('exit', () => {
    try {
        fs.rmdirSync(wikiDir, {
            recursive: true,
        });
        twServer.kill();
        mockServer.kill();
    } catch(_) {} // ignore exceptions to make sure we exit cleanly with the
                  // right status code
});

asyncMain().then(() => {
    // XXX exit conditional on test results
    process.exit(0);
}, e => {
    console.log('oh shit', e);
    process.exit(1);
});

async function testBasic() {
    let [res, body] = await importURL(mockURL('/basic.html'));

    let payload = JSON.parse(body);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(payload.title, 'Blog');

    // XXX get the underlying tiddler and check it?
}

let testFunctions = [
    testBasic,
];

async function asyncMain() {
    await waitForServerReady();

    for(let test of testFunctions) {
        await test();
    }
}

async function waitForServerReady() {
    while(true) {
        try {
            await request('GET', `http://localhost:${TIDDLYWIKI_PORT}/status`);
            return;
        } catch(e) {
            if(e.code != 'ECONNREFUSED') {
                throw e;
            }
        }
        await sleep(1000);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function request(method, url) {
    return new Promise((resolve, reject) => {
        let req = http.request(url, {
            method,
            timeout: 5000,
            headers: {
                'X-Requested-With': 'TiddlyWiki',
            },
        });
        req.end();

        let chunks = [];

        req.on('response', res => {
            res.on('data', data => {
                chunks.push(data);
            });

            res.on('end', () => {
                // XXX do I need to clean up resources here?
                resolve([res, Buffer.concat(chunks).toString()]);
            });

            res.on('error', reject);
        });

        req.on('error', reject);
        req.on('timeout', () => reject(TimeoutError));
    });
}

async function importURL(urlToImport) {
    let url = new URL(`http://localhost:${TIDDLYWIKI_PORT}/plugins/hoelzro/first-class-urls/import`);
    url.searchParams.append('url', urlToImport);

    return await request('PUT', url);
}

function mockURL(path) {
    return `http://localhost:${MOCK_SERVER_PORT}${path}`;
}
