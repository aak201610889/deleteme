class SocketError extends Error {
  constructor(message, code = 500) {
      super(message);
      this.code = code;
  }
}
const socketErrorHandler = (socket, err) => {
  console.error('Socket Error:', err.message);
  socket.emit('errorResponse', {
      message: err.message,
      code: err.code || 500  
  });
};
module.exports = { SocketError, socketErrorHandler };
