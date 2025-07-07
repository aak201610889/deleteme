const socketIo = require("socket.io");
const logger=require('./middlewares/logger')
const { updateSocketId } = require("./middlewares/authMiddleware");

const customerSocket = require("./socket/customerSocket");
const adminSocket = require("./socket/adminSocket");
const chalk = require("chalk");
let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin:"*",
      credentials: true,
    },
  });
  


  io.on("connection", (socket) => {

    updateSocketId(socket);
    socket.join("admin-room");
    customerSocket(io, socket);
    adminSocket(io, socket);

    logger.info(`${chalk.red("User disconnected")} ${chalk.yellow("Socket ID:")} ${socket.id}`);

  });

  return io;
}

module.exports = { initializeSocket, io };
