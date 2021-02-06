const fs      = require('fs');
const http    = require('http');
const path    = require('path');
const process = require('process');

let port = 0;

if(process.argv.length > 2) {
    port = parseInt(process.argv[2]);
}

function parseHTTPResponse(data) {
    let previousNewlineIndex = 0;
    let nextNewlineIndex;
    let preludeLines = [];
    while((nextNewlineIndex = data.indexOf(10, previousNewlineIndex)) >= 0 && nextNewlineIndex > (previousNewlineIndex + 1)) {
        preludeLines.push(data.slice(previousNewlineIndex, nextNewlineIndex).toString());
        previousNewlineIndex = nextNewlineIndex + 1;
    }

    let body;
    if(nextNewlineIndex == -1) {
        body = Buffer.from([]);
    } else {
        body = data.slice(nextNewlineIndex + 1);
    }

    let [statusLine, ...lines] = preludeLines;

    let m = /^HTTP\/\d[.]\d\s+(\d+)/.exec(statusLine);
    if(!m) {
        throw new Error('invalid HTTP response');
    }
    let statusCode = parseInt(m[1]);

    let headers = {};

    for(let line of lines) {
        let m = /^(\S+)\s*:\s*(.*)$/.exec(line);
        if(!m) {
            throw new Error('invalid HTTP response');
        }
        headers[m[1]] = m[2];
    }

    headers['Content-Length'] = body.length.toString();

    return {
        statusCode,
        headers,
        body,
    };
}

let server = http.createServer((req, res) => {
    function retrieveFile(filePath) {
        fs.readFile(filePath, (err, data) => {
            if(err != null) {
                if(err.code == 'ENOENT') {
                    res.writeHead(404, {
                        'Content-Length': 0,
                        'Content-Type': 'text/plain',
                    });
                } else if(err.code == 'EISDIR') {
                    return retrieveFile(path.join(filePath, 'index.html'));
                } else {
                    console.error('error: ', err);
                    res.writeHead(500, {
                        'Content-Length': 0,
                        'Content-Type': 'text/plain',
                    });
                }
            } else {
                let {statusCode, headers, body} = parseHTTPResponse(data);
                res.writeHead(statusCode, headers);
                res.write(body);
            }

            res.end();
        });
    }

    let filePath = (new URL(req.url, 'http://localhost/')).pathname;
    filePath = path.join(process.cwd(), 'unit-test', 'mock-data', filePath);
    retrieveFile(filePath);
});

server.on('listening', () => {
    console.log(`Listening on port ${server.address().port}`);
});

server.listen({
    port,

    host: '127.0.0.1',
});
