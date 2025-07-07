const Order = require("../models/Order");
const mongoose = require("mongoose");
const User = require("../models/User");
const { getWaitingOrders, addProductInOrder, PendingOrdersForCustomer, createNewOrder } = require("../services");
const { socketErrorHandler } = require("../shared/socketErrorHandler");
const { verifySocketToken } = require("../middlewares/authMiddleware");
const logger=require('../middlewares/logger');

function customerSocket(io, socket) {

    socket.on(
        "orderCustomer",
        async ({ tableNumber, productsIds, customerId,phoneNumber,username, comments }, callback) => {



          verifySocketToken(socket, callback, async () => {
          try {
            const user = await User.findById(customerId);
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
              logger.warn(`Invalid customer ID format: ${customerId}`);

              return callback({
                success: false,
                error: "Invalid customer ID format",
              });
            }
            if (user) {
              user.socketId = socket.id;
              await user.save();
  
              const orderByCustomer = await PendingOrdersForCustomer(customerId);

                await createNewOrder(
                  { tableNumber, productsIds },
                  customerId,
                  phoneNumber,
                  username,
                  comments
                );


                console.log("*********************************************************")
              const orders = await getWaitingOrders();

              io.to("admin-room").emit("orderAdmin", orders);
              logger.info(`New order created for customer: ${username} (ID: ${customerId}) at table: ${tableNumber}`);

              callback("ok");
            }
          } catch (error) {
            logger.error(`Error in orderCustomer event: ${error.message}`);

            socketErrorHandler(socket, error);
          }

        })
        }
      );

      socket.on("callGarson", async ({ tableNumber }, callback) => {
        verifySocketToken(socket, callback, async () => {
        try {
          if (tableNumber) {
            io.to("admin-room").emit("callgarsonToAdmin", tableNumber);
            logger.info(`Garson call sent for table: ${tableNumber}`);

            callback("send successfully");
          }
        } catch (error) {
          logger.error(`Error in callGarson event: ${error.message}`);

          socketErrorHandler(socket, error);
        }

      })
      });
  
      socket.on("getOrderByCustomerId", async ({ userId }, callback) => {
        verifySocketToken(socket, callback, async () => {
        try {
        const getOrderByCustoemrId = await Order.find({
          customerId: userId,
        }).sort({ createdAt: -1 });
  
        if (getOrderByCustoemrId) {
          logger.info(`Fetching orders for customer ID: ${userId}`);

          callback(getOrderByCustoemrId);
        } else {
          logger.warn(`No orders found for customer ID: ${userId}`);

          callback("error");
        }
    } catch (error) {
      logger.error(`Error in getOrderByCustomerId event: ${error.message}`);

        socketErrorHandler(socket, error);
      }
      })
      });





}
module.exports =customerSocket


