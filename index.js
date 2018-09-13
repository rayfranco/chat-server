// Setup basic express server
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const port = process.env.PORT || 3000

const Socket = require('./src/socket')

// Express
server.listen(port, () => {
  console.log('Server listening at port %d', port)
})
app.use(express.static(__dirname + '/public'))

// Chatroom
io.on('connection', (socket) => Socket(io)(socket))
