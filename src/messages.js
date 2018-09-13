const socket = require('./socket')
const ERRORS = require('./socket')

const resolve = require('path')

const MESSAGES = []

function isValid (message) {
  return true
}

function isCommand (message) {
  return typeof message === 'string' && message[0] === '/'
}

function isSpam (socket) {
  let { lastMessage, tries } = socket
  
  if (lastMessage && lastMessage > Date.now() - 1300) {
    if (tries > 3) return true
    else tries += 1
  } else {
    tries = 0
  }
  lastMessage = Date.now()
  return false
}

function getCommand (message) {
  return {
    command: 'commandName',
    value: 'someValue'
  }
}

function formatMessage (message, isCommand = false) {
  return {
    messages: MESSAGES,
    message: {
      type: isCommand ? 'command' : 'message',
      ...message
    }
  }
}

exports.default = {
  add (message, socket) {
    if (isSpam(socket)) {
      return Promise.reject(ERRORS.MESSAGE_SPAMMING)
    }
    // TODO: Strip message spaces
    if (!isValid(message)) {
      return Promise.reject(ERRORS.MESSAGE_INVALID)
    }
    message = {
      ...message,
      created: new Date()
    }
    if (isCommand(message)) {
      return Promise.resolve(formatMessage(message, true))
    }
    MESSAGES.push(message)
    return Promise.resolve(formatMessage(message))
  }
}