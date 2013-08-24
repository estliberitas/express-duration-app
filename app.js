'use strict';

var express = require('express')
  , http = require('http')
  , path = require('path')
  , routes = require('./routes')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


app.configure('all', function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler());
});


io.configure(function() {
  io.set('transports', ['websocket']);
  io.set('log level', 2);
});

routes(app, io);

server.listen(app.get('port'));