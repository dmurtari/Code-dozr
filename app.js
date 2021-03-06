var Duplex = require('stream').Duplex;
var express = require('express');
var serveStatic = require('serve-static');
var browserChannel = require('browserchannel').server;
var livedb = require('livedb');
var _ = require('lodash');
var fs = require('fs');

var shareCodeMirror = require('share-codemirror');

var app = express();

var db = require('livedb-mongo')('mongodb://admin:codedozr@ds031982.mongolab.com:31982/code-dozr?auto_reconnect', {
    safe: true
});

app.set('port', (process.env.PORT || 3000));
app.set('view engine', 'jade')

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

var supportedLanguages = JSON.parse(fs.readFileSync('supported_languages.json'));

app.get('/', function(req, res) {
    res.render('index.jade');
});

app.get('/supported_languages', function(req, res){
    res.send(supportedLanguages);
});

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: server
});

app.use(serveStatic(__dirname + '/public/'));

app.use(serveStatic(sharejs.scriptsDir));
app.use(serveStatic(shareCodeMirror.scriptsDir));

app.use('/codemirror', express.static(__dirname + '/node_modules/codemirror/'));
require('./routes/editor')(app)
require('./routes/about')(app)


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
});

