const usersList = require('./users').LIST
const users = require('./users').default
const messages = require('./messages').default
const { EVENTS_IN, EVENTS_OUT } = require('./const.events')
const { ERRORS, ERROR_MESSAGES } = require('./const.errors')

exports.default = (io) => (socket) => new Socket(socket, io)

class Socket {
  constructor (socket, io) {
    this.io = io
    this.socket = socket

    socket.on(EVENTS_IN.USER_REGISTER, this.onUserRegister.bind(this))
    socket.on(EVENTS_IN.USER_TYPING, this.onUserTyping.bind(this))
    socket.on(EVENTS_IN.MESSAGE_NEW, this.onMessageNew.bind(this))
    socket.on('disconnect', this.onDisconnect.bind(this))
  }

  // Events 

  onUserRegister (data) {
    console.log('user registering')
    if (this.socket.user) {
      this.emitError(ERRORS.ALREADY_CONNECTED)
      return
    }
    users.register(this.socket, data)
      .then((user) => {
        this.socket.user = user
        this.emitUserAdd(user)
        this.emitMessagesUpdate()
        console.log('user registered', user)
      })
      .catch((errCode) => {
        console.error('Error onUserRegister', errCode)
        this.emitError(errCode)
      })
  }

  onUserTyping () {
    this.emitTyping(true)
    users.typing(this.socket)
      .then((wasTyping) => {
        this.emitTyping(false)
      })
      .catch((err) => {
        // Whatever
      })
  }

  onMessageNew (data) {
    if (!this.socket.user) {
      console.error('Some dude try to send message before login')
      return
    }
    const username = this.socket.user.username
    const user = users.getUserFromUsername(username)

    messages.add(data, this.socket)
      .then((data) => {
        this.emitMessage(data)

        if (this.socket.typing) {
          this.socket.typing = false
          user.typing = false
          this.emitTyping(false)
        }
      })
      .catch((errorCode) => {
        this.emitError(errorCode)
        console.error('Error sendMessage')
        // Message can't be sent for some reason
      })
  }

  onDisconnect() {
    const user = this.socket.user
    if (user) {
      users.unregister(this.socket)
        .then((deletedUser) => {
          console.log(this.socket.user.username + ' has disconnected.')
          this.emitUserRemove(deletedUser)
        })
        .catch((err) => {
          console.error('Error onDisconnect', err)
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

  emitMessage (data) {
    switch (data.message.type) {
      case 'command': {
        const regex = /^\/(\w+) ?(.*)$/
        const exec = regex.exec(data.message.text)
        this.io.emit(EVENTS_OUT.COMMAND_NEW, {
          command: exec[1],
          value: exec[2]
        })
        break
      }
      case 'message':
      default:
        this.io.emit(EVENTS_OUT.MESSAGE_NEW, data)
    }
  }

  emitMessagesUpdate() {
    this.socket.emit(EVENTS_OUT.MESSAGES_UPDATE, {
      messages: messages.get()
    })
  }

  emitUserAdd (user) {
    this.socket.emit(EVENTS_OUT.USER_REGISTERED, user)
    this.io.emit(EVENTS_OUT.USERS_UPDATE, {
      users: usersList,
      type: 'join',
      user
    })
  }

  emitUserRemove (user) {
    this.io.emit(EVENTS_OUT.USERS_UPDATE, {
      users: usersList,
      type: 'left',
      user
    })
  }
}

exports.Socket = Socket