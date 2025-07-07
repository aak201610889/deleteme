const jwt = require("jsonwebtoken");
const SECRETKEY20S =
  process.env.SECRETKEY20S || "$PsgyT72QFPKft&S&g%nJ$^^*mx%gKgZq";
const User = require("../models/User");
const chalk = require("chalk");


const logger=require('../middlewares/logger')
const verifyToken = (requiredRole) => (req, res, next) => {
  const token = req.cookies["authToken"];


  if (!token) {
    logger.warn("No token provided.");
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token,
      SECRETKEY20S 
    );
    req.user = decoded;

    if (requiredRole && decoded.role !== requiredRole) {
      logger.warn("Insufficient permissions.");
      return res.status(401).json({ message: "Insufficient permissions." });
    }

    next();
  } catch (error) {
    logger.error("Invalid or expired token: " + error.message);

    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const verifySocketToken = (socket,callback, next) => {
  const cookie = socket.handshake.headers.cookie || "";
  const token = cookie
    .split("; ")
    .find((c) => c.startsWith("authToken="))
    ?.split("=")[1];


    if (!token) {
      logger.warn("Unauthorized: No token provided");

      return callback({
        success: false,
        error: "Unauthorized: No token provided",
      });
    }


  try {
    const decoded = jwt.verify(token, SECRETKEY20S);
    socket.user = decoded;
    next();
  } catch (err) {
    logger.error("Invalid token: " + err.message);

   return callback({ success: false, error: "Invalid token" });
  }
};
const verifyAdminRole = async (socket, callback, next) => {
  const cookie = socket.handshake.headers.cookie || "";
  const token = cookie
    .split("; ")
    .find((c) => c.startsWith("authToken="))
    ?.split("=")[1];

  if (!token) {
    logger.warn("Unauthorized: No token provided");

    return callback({
      success: false,
      error: "Unauthorized: No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, SECRETKEY20S);

    if (decoded.role !== "***") {
      logger.warn("Forbidden: Admin role required");

      return callback({
        success: false,
        error: "Forbidden: Admin role required",
      });
    }
    socket.user = decoded; // Attach decoded user information to socket
    next();
  } catch (err) {
    logger.error("Invalid token: " + err.message);

    return callback({ success: false, error: "Invalid token" });
  }
};

const updateSocketId = async (socket) => {
  try {
 

    const cookie = socket.handshake.headers.cookie || "";
    const token = cookie
      .split("; ")
      .find((c) => c.startsWith("authToken="))
      ?.split("=")[1];
  
     
    if (!token) {
      console.error(chalk.red("Authentication token is required"));
      return; // Exit early if no token
    }

    let userId;

    try {
      const decoded = jwt.verify(token, SECRETKEY20S);
      userId = decoded.id; // Extract userId from token
    } catch (error) {
      logger.error("Invalid or expired token: " + error.message);

      console.error(chalk.red("Invalid or expired token"), error.message);
      return; // Exit early if token verification fails
    }

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        // Update socketId if necessary
        if (user.socketId !== socket.id) {
          logger.info(
            `${chalk.green("User Connected")} 
            ${chalk.yellow("Socket ID:")} ${chalk.blue(socket.id)} 
            ${
              user.phoneNumber
                ? `${chalk.yellow("Phone Number:")} ${chalk.blue(user.phoneNumber)}`
                : `${chalk.yellow("Email:")} ${chalk.blue(user.email.slice(0, 5))}`
            }`
          );
          user.socketId = socket.id;
          await user.save();
        }
      } else {
        logger.error(chalk.red(`User not found: ${userId}`));
      }
    }
  } catch (error) {
    logger.error(chalk.red("Error in updateSocketId:"), error.message);
  }
};

module.exports = {
  updateSocketId,
  verifyToken,
  verifyAdminRole,
  verifySocketToken,
};
