
# Socket.IO Chat

Ooops

A simple chat for socket.io

## How to use

```
$ npm install
$ node index.js
```

And point your browser to `http://localhost:3000`. Optionally, specify
a port by supplying the `PORT` env variable.

## API (incoming)
Messages sent to server:

### `user register` 
Register a user in the chat.
```
{
  username: String,
  avatar: String?
})
```

### `user typing` 
When the user start typing. No need to send when the user stops.

### `message new` 
When a new message has to ben sent to the chat
```
message String
```

## API (outcoming) 
Messages sent to client:

### `users update`
When new users has joined/left the room
```
{
  type: String<join|left>
  user: User,
  users: Array<User>
}
```

### `user registered`
When you client got registered (after sending `user register`)

### `messages update`
When your client got registered you get a historical messages updates
```
{
  messages: Array<Messages>
}
```

### `user typing`
When a user start/stop typing
```
typing Boolean
```

### `message new`
When a new message is sent in the room
```
{
  message: {
    user: User,
    text: String,
    created: Date
  },
  messages: Array<Message>
}
```

### `command new`
When a command has been issued
```
{
  command: String,
  value: String
}
```

### `chat error`
When an error has been thrown (see error codes)
```
{
  code: Number,
  message: String
}
```

## Error codes

* `100`: You are already connected with a username
* `101`: Username is already taken
* `102`: Username is invalid
* `200`: The message is invalid
* `201`: You are spamming too much, calm down!