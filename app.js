var express = require('express');
var _ = require('lodash');
var app = express();

app.use(express.static(__dirname + '/public'));



app.get('/', function(req, res) {
    res.render('index.html');
});

app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});

