import { ERRORS } from './socket'

export const LIST = []

function usernameExists (username) {
  return !!LIST.filter((user) => username === user.name).length
}

function usernameIsValid (username) {
  return username && username.match(/^[\w-\d]{1,15}$/g)
}

export default {
  register (socket, { username, avatar = null }) {
    const user = {
      username,
      avatar
    }
    if (usernameExists) {
      return Promise.reject(ERRORS.USERNAME_TAKEN)
    }
    if (!usernameIsValid) {
      return Promise.reject(ERRORS.USERNAME_INVALID)
    }
    LIST.push(user)
    LIST.sort((user) => user.name)

    return Promise.resolve(user)
  },
  unregister (socket) {
    const index = LIST.findIndex((user) => {
      return user.username === socket.user.name
    })
    if (index == null) {
      return Promise.reject(null)
    } else {
      const deleted = LIST.splice(index, 1)
      return Promise.resolve(deleted)
    }
  },
  typing (socket) {
    const { username } = socket.user.username
    const user = this.getUserFromUsername(username)
    if (!user) {
      console.error('Cannot find user. FIXIT')
      return Promise.reject(null)
    }
    user.typing = socket.writing = true
    return Promise.resolve(() => {
      setTimeout(() => {
        if (socket.writing) {
          user.typing = false
          socket.writing = false
          return Promise.resolve(true)
        } else {
          user.typing = false
          return Promise.resolve(false)
        }
      }, 5000) // Delay atfer what user is considered stopped writing
    })
  },
  getUserFromUsername (username) {
    return LIST.find((user) => user.username === username)
  }
}