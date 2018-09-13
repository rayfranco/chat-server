const usersList = require('./users').LIST
const users = require('./users')
const messages = require('./messages')

exports.default = (io) => (socket) => new Socket(socket, io)

const ERRORS = exports.ERRORS = {
  ALREADY_CONNECTED: 100,
  USERNAME_TAKEN: 101,
  USERNAME_INVALID: 102,
  MESSAGE_INVALID: 200,
  MESSAGE_SPAMMING: 201
}

const ERROR_MESSAGES = exports.ERROR_MESSAGES = {
  100: 'You are already connected with a username',
  101: 'Username is already taken',
  102: 'Username is invalid',
  200: 'The message is invalid',
  201: 'You are spamming too much, calm down!'
}

const EVENTS_IN = exports.EVENTS_IN = {
  USER_REGISTER: 'user register',
  USER_TYPING: 'user typing',
  MESSAGE_NEW: 'message new'
}

const EVENTS_OUT = exports.EVENTS_OUT = {
  USERS_UPDATE: 'users update',
  USER_REGISTERED: 'user registered',

  // { user: User, typing: bool }
  USER_TYPING: 'user typing',
  MESSAGE_NEW: 'message new',
  COMMAND_NEW: 'command new',
  ERROR: 'error'
}


class Socket {
  constructor (socket, io) {
    this.io = io
    this.socket = socket

    socket.on(EVENTS_IN.USER_REGISTER, this.onUserRegister, this)
    socket.on(EVENTS_IN.USER_TYPING, this.onUserTyping, this)
    socket.on(EVENTS_IN.MESSAGE_NEW, this.onMessageNew, this)
    socket.on('disconnect', this.onDisconnect, this)
  }

  // Events 

  onUserRegister (data) {
    users.register(data)
      .then((user) => {
        this.socket.user = user
        this.emitUserAdd(user)
      })
      .catch((errCode) => {
        this.emitError(errCode)
      })
  }

  onUserTyping () {
    users.typing(this.socket)
      .then((user) => {
        this.emitTyping(true)
      })
      .then((wasTyping) => {
        if (wasTyping) {
          this.emitTyping(false)
        }
      })
      .catch((err) => {
        // Whatever
      })
  }

  onMessageNew (data) {
    const { username } = this.socket.user
    const user = users.getUserFromUsername(username)

    messages.add(data, this.socket)
      .then(({ message, messages }) => {
        // New message has been added
        // Check if command or not
        this.emitMessage(message, messages)
        
        if (this.socket.typing) {
          this.socket.typing = false
          user.typing = false
          this.emitTyping(false)
        }
      })
      .catch((err) => {
        // Message can't be sent for some reason
      })
  }

  onDisconnect () {
    const { user } = this.socket
    if (user) {
      users.unregister(user)
        .then((deletedUser) => {
          console.log(this.socket.user.username + ' has disconnected.')
          this.emitUserRemove(deletedUser)
        })
    }
  }

  // Emits

  emitTyping (typing) {
    const user = this.socket.user
    this.io.emit(EVENTS_OUT.USER_TYPING, {
      user,
      typing
    })
  }

  emitError (errCode) {
    this.socket.emit(EVENTS_OUT.ERROR, {
      code: errCode,
      message: ERROR_MESSAGES[errCode]
    })
  }

  emitMessage (message, messages) {
    switch (message.type) {
      case 'command': {
        this.socket.broadcast(EVENTS_OUT.COMMAND_NEW, message)
      }
      case 'message':
      default:
        this.socket.broadcast(EVENTS_OUT.MESSAGE_NEW, {
          message,
          messages
        })
    }
  }

  emitUserAdd (user) {
    this.io.broadcast(EVENTS_OUT.USERS_UPDATE, {
      users: usersList,
      type: 'join',
      user
    })
  }

  emitUserRemove (user) {
    this.socket.broadcast.emit(EVENTS_OUT.USERS_UPDATE, {
      users: usersList,
      type: 'left',
      user
    })
  }
}

exports.Socket = Socket