// app.use(express.static(__dirname + '/public'));



// app.get('/', function(req, res) {
//     res.render('index.html');
// });

var Duplex = require('stream').Duplex;
var express = require('express');
var http = require('http');
var serveStatic = require('serve-static');
var browserChannel = require('browserchannel').server;
var livedb = require('livedb');

// This is sharejs server with no persistence, need to change
var backend = livedb.client(livedb.memory());
backend.submit('textareas', 'textarea1', { create: {type: 'text', data: ''}},
    function (err, version, transformedByOps, snapshot) {
        console.log('Created document. Err: ' + err + ". Versoin: " + version);
    }
);

var sharejs = require('share');
var share = sharejs.server.createClient({ backend: backend });

var app = express();

app.use(serveStatic(__dirname + "/../public"));
app.use(serveStatic(sharejs.scriptsDir));
app.use(browserChannel({ cors: '*' }, function (client) {
    var stream = new Duplex({ objectMode: true});

    stream._read = function () {};
    stream._write = function (chunk, encoding, callback) {
        if (client.state !== 'closed') {
            client.send(chunk);
        }
        callback();
    };

    client.on('message', function (data) {
        stream.push(data);
    });

    client.on('close', function (reason) {
        stream.push(null);
        stream.emit('close');
    });

    stream.on('end', function () {
        client.close();
    });

    return share.listen(stream);
}));

app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});
