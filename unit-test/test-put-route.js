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

function objectsMatch(got, expected) {
    for(let key of Object.keys(expected)) {
        assert.strictEqual(got[key], expected[key]);
    }
}

async function testBasic() {
    let url = mockURL('/basic.html');
    let [res, body] = await importURL(url);

    let payload = JSON.parse(body);

    assert.strictEqual(res.statusCode, 201);
    objectsMatch(payload, {
        title: 'Blog',
    });

    let tiddler = await getTiddler('Blog');
    objectsMatch(tiddler, {
        location: url,
        text: url,
        title: 'Blog',
        url_tiddler: 'true',
    });
}

async function testOpenGraph() {
    let url = mockURL('/opengraph.html');
    let [res, body] = await importURL(url);

    let payload = JSON.parse(body);

    assert.strictEqual(res.statusCode, 201);
    objectsMatch(payload, {
        title: 'OpenGraph Test',
    });

    let tiddler = await getTiddler('OpenGraph Test');
    objectsMatch(tiddler, {
        description: 'This is a test that opengraph meta elements work',
        location: url,
        text: `${url}\n\nThis is a test that opengraph meta elements work`,
        title: 'OpenGraph Test',
        url_tiddler: 'true',
    });
}

async function testTwitterCard() {
    let url = mockURL('/twitter-card.html');
    let [res, body] = await importURL(url);

    let payload = JSON.parse(body);

    assert.strictEqual(res.statusCode, 201);
    objectsMatch(payload, {
        title: 'Twitter Card Test',
    });

    let tiddler = await getTiddler('Twitter Card Test');
    objectsMatch(tiddler, {
        description: 'This is a test that Twitter card meta elements work',
        location: url,
        text: `${url}\n\nThis is a test that Twitter card meta elements work`,
        title: 'Twitter Card Test',
        url_tiddler: 'true',
    });
}

let testFunctions = [
    testBasic,
    testOpenGraph,
    testTwitterCard,
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

async function getTiddler(title) {
    let url = new URL(`http://localhost:${TIDDLYWIKI_PORT}/recipes/default/tiddlers/${title}`);
    let [_, body] = await request('GET', url);
    let t = JSON.parse(body);
    Object.assign(t, t.fields);
    delete t.fields;
    return t;
}

function mockURL(path) {
    return `http://localhost:${MOCK_SERVER_PORT}${path}`;
}
