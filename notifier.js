var express    = require('express');
var http       = require('http');
var jwt        = require('jsonwebtoken');
var ioJwt      = require('socketio-jwt');
var socketio   = require('socket.io');
var logger     = require('morgan');
var bodyParser = require('body-parser');
var underscore = require('underscore');

var app = express();
var server = http.createServer(app);
var io = socketio(server);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

var jwtSecret = '123456';
var apiKey = '333';
var userList   = [];

var userRepository = [
  {
    id: 1,
    name: 'Mateus',
    apikey: '111'
  },
  {
    id: 2,
    name: 'José',
    apikey: '222'
  },
  {
    id: 3,
    name: 'Matias',
    apikey: '333'
  }
];

var User = function(id, socket) {
  this.id = id;
  this.socket = socket;
};

app.post('/auth', function(req, res) {
  var user = underscore.find(userRepository, function(user){
    return user.apikey == req.body.apiKey;
  });

  if (user) {
    var token = jwt.sign({id: user.id}, jwtSecret, { expiresInMinutes: 60*5 });

    res.json({token: token, userId: user.id});
  } else {
    res.status(401).end();
  }
});

io.use(ioJwt.authorize({
  secret: jwtSecret,
  handshake: true
}));

function sendUsers() {
  var ids = underscore.map(userList, function(user){
    return user.id;
  });

  underscore.each(userList, function(user){
    console.log(ids);
    user.socket.emit('updateUsers', { users: ids });
  });
}

io.on('connection', function(socket) {
  var user = new User(socket.decoded_token.id, socket);
  userList.push(user);

  sendUsers();

  socket.on('disconnect', function() {
    var userId = socket.decoded_token.id;

    userList = underscore.reject(userList, function(user) {
      return user.id == userId;
    });

    sendUsers();
  });
});


server.listen(3000);
