// Setup basic express server
var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var port = process.env.PORT || 3000

// Express
server.listen(port, function () {
  console.log('Server listening at port %d', port)
})
app.use(express.static(__dirname + '/public'))

// Sockets

var AVATARS = [
  ''
]

var ERRORS = {
  100: 'You are already connected',
  101: 'Username is already taken',
  102: 'Username is invalid'
}

// Client EMIT

// register user
// new message
// typing

// Server EMIT

// user registered (User object)
// users update (Users list)
// new message (Message object)
// typing ()
// stop typing ()

var users = []

function usernameExists(username) {
  return users.filter((user) => username === user.name).length
}
function usernameValid(username) {
  return username && username.match(/^[\w-\d]+$/g)
}

// Chatroom

io.on('connection', function (socket) {
  socket.emit('users update', users)
  // register user (String username)
  socket.on('register user', function(data) {
    if (socket.user) {
      return socket.emit('chat error', { code: 100, message: ERRORS[100] })
    }

    if (usernameExists(data.username)) {
      return socket.emit('chat error', { code: 101, message: ERRORS[101] })
    }

    if (!usernameValid(data.username)) {
      return socket.emit('chat error', { code: 102, message: ERRORS[102] })
    }

    var user = {
      name: data.username,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    }

    users.push(user)
    socket.user = user

    socket.emit('user registered', user)
    io.emit('users update', users)
  })

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    console.log(socket.user.name + ' has sent message. '+ new Date().toString())
    socket.broadcast.emit('new message', {
      username: socket.user.name,
      text: data,
      time: new Date().toString()
    })
  })

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    })
  })

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    })
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (socket.user) {
      users = users.filter((user) => {
        user.name !== socket.user.name
      })
      console.log(socket.user.name + ' has disconnected.')
      console.log('users update ', users)
      socket.broadcast.emit('users update', users)
    }
  })
})
