const { ERRORS } = require('./const.errors')

const LIST = exports.LIST = []

function usernameExists (username) {
  return !!LIST.filter((user) => username === user.username).length
}

function usernameIsValid (username) {
  return typeof username === 'string' && username.match(/^[\w-\d]{1,15}$/g)
}

exports.default = {
  register (socket, { username = '', avatar = null }) {
    const user = {
      username,
      avatar
    }
    if (usernameExists(username)) {
      console.log('USERNAME_EXISTS: ' + username)
      return Promise.reject(ERRORS.USERNAME_TAKEN)
    }
    if (!usernameIsValid(username)) {
      console.log('USERNAME_INVALID: ' + username)
      return Promise.reject(ERRORS.USERNAME_INVALID)
    }
    LIST.push(user)
    LIST.sort((user) => user.name)

    return Promise.resolve(user)
  },
  unregister (socket) {
    if (!socket.user) return Promise.reject('No socket user found')
    const index = LIST.findIndex((user) => {
      return user.username === socket.user.username
    })
    if (index == null) {
      return Promise.reject(null)
    } else {
      const deleted = LIST.splice(index, 1)[0]
      return Promise.resolve(deleted)
    }
  },
  typing (socket) {
    let username = ''
    if (typeof socket.user !== 'undefined') username = socket.user.username
    else {
      console.error('Cannot find user when typing. FIXIT')
      return Promise.reject(null)
    }
    const user = this.getUserFromUsername(username)
    if (!user) {
      console.error('Cannot find user. FIXIT')
      return Promise.reject(null)
    }
    socket.writing = true
    
    const checkLater = new Promise((resolve, reject) => {
      if (socket.typingTimeout) {
        clearTimeout(socket.typingTimeout)
      }
      socket.typingTimeout = setTimeout(() => {
        if (socket.writing) {
          socket.writing = false
          return resolve(true)
        } else {
          return resolve(false)
        }
      }, 5000) // Delay atfer what user is considered stopped writing
    })

    return Promise.resolve(checkLater)
  },
  getUserFromUsername (username) {
    return LIST.find((user) => user.username === username)
  }
}