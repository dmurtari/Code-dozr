var Duplex = require('stream').Duplex;
var express = require('express');
var serveStatic = require('serve-static');
var browserChannel = require('browserchannel').server;
var livedb = require('livedb');
var shareCodeMirror = require('share-codemirror');

var app = express();

var db = require('livedb-mongo')('mongodb://localhost:27017/codeDozr?auto_reconnect', {
    safe: true
});

app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});

var backend = livedb.client(db);
var sharejs = require('share');
var share = sharejs.server.createClient({
    backend: backend
});

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: server
});

app.use(serveStatic(__dirname + '/public/'));

app.use(serveStatic(sharejs.scriptsDir));
app.use(serveStatic(shareCodeMirror.scriptsDir));

app.use('/codemirror', express.static(__dirname + '/node_modules/codemirror/'));

wss.on('connection', function (client) {
    console.log('Client connected');
    var stream = new Duplex({
        objectMode: true
    });

    stream._write = function (chunk, encoding, callback) {
        client.send(JSON.stringify(chunk));
        return callback();
    }

    stream._read = function () {}

    stream.headers = client.upgradeReq.headers;

    stream.remoteAddress = client.upgradeReq.connection.remoteAddress;

    client.on('message', function (data) {
        return stream.push(JSON.parse(data));
    });

    stream.on('error', function (msg) {
        return client.close(msg);
    });

    client.on('close', function (reason) {
        stream.push(null);
        stream.emit('close');
        console.log('Client disconnected');
        return client.close(reason);
    });

    stream.on('end', function () {
        return client.close();
    });

    return share.listen(stream);
})
