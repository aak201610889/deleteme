const express = require("express");
const chalk = require("chalk");
const http = require("http");
const expressApp = require("./app");
// const openurl = require("openurl");
 const xssClean = require("xss-clean"); // Import xss-clean
const logger = require("./middlewares/logger");
const connectDB = require("./database/connect");
const cors = require('cors'); 

const { initializeSocket } = require("./socket");

const startServer = async () => {
  try {
    const app = express();
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5009',
      'http://192.168.1.200:5009',
     'https://resturantv3-2025.onrender.com'
    ];


const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
    // Apply CORS middleware
    app.use(cors(corsOptions));
   app.use(xssClean());
    await connectDB();

  
    await expressApp(app);

    const server = http.createServer(app);
    const io = initializeSocket(server);
    const PORT = process.env.PORT || 5009;
    server.listen(PORT, () => {
      logger.info(
        chalk.bgBlue(`Server is running on http://192.168.1.200:${PORT}`)
      );

      //openurl.open(`http://192.168.1.200:${PORT}/admin/order`);
    });
  } catch (err) {
    logger.error(chalk.gray(`Failed to start server: ${err.message}`));
    // process.exit(1);
  }
};

startServer();
