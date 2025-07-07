const { verifyAdminRole } = require("../middlewares/authMiddleware");
const Order = require("../models/Order");
const User = require("../models/User");
const { handleRejection, handleSuccess, handlePaid } = require("../services");
const { socketErrorHandler } = require("../shared/socketErrorHandler");
const ProductService = require("../services/ProductService");
const logger=require('../middlewares/logger')



function adminSocket(io, socket) {
  socket.on("statusFromAdmin", async ({ orderId, status,reason=null,tax=0 }, callback) => {
    logger.info(`statusFromAdmin event triggered with orderId: ${orderId}, status: ${status}`);

    verifyAdminRole(socket, callback, async () => {
      try {
        const order = await Order.findById(orderId).populate(
          "customerId",
          "username email socketId"
        );
     
        if (order && order.customerId && order.customerId.socketId) {
          logger.info(`Order found for customer: ${order.customerId.username}, socketId: ${order.customerId.socketId}`);


          if (status === "rejected") {
            await handleRejection(orderId, reason);
            io.to(order.customerId.socketId).emit("getStatus", {
              orderId,
              status,
            });
            callback({ success: true, status, customerId: order.customerId });
            io.to(order.customerId.socketId).emit("getStatus", {
              orderId,
              status,
            });
          } else if (status === "approved") {
            await handleSuccess(orderId);
            callback({ success: true, status, customerId: order.customerId });
            io.to(order.customerId.socketId).emit("getStatus", {
              orderId,
              status,
            });
          } else if (status === "paid") {
            const { message, paymentStatus } = await handlePaid(
              orderId,
              order.customerId,
              tax
            );
            callback({
              sucess: true,
              status: paymentStatus,
              message: message,
            });
            const customerSocket = await User.findById(order.customerId); // Fetch the user to get their socketId

            if (paymentStatus === "paid") {
              io.to(customerSocket.socketId).emit("getStatus", {
                orderId,
                status: "paid",
                
              });

              await User.findByIdAndDelete(order.customerId);
            }
          }
        } else {
          callback({ success: false, error: "Order or customer not found" });
        }
      } catch (error) {
        logger.error(`Error updating order status for orderId: ${orderId}, error: ${error.message}`);

        callback({ success: false, error: "An error occurred" });
        socketErrorHandler(socket, error);
      }
    });
  });

  socket.on("approved", async (callback) => {

    
    logger.info("approved event triggered");

    verifyAdminRole(socket, callback, async () => {

try {
  const approvedOrder = await Order.find({
    status: "approved",
  }).sort({ createdAt: -1 });
  logger.info(`Retrieved approved orders: ${approvedOrder.length} orders`);
  
  callback(approvedOrder);

  
} catch (error) {
  logger.error(`Error retrieving approved orders: ${error.message}`);
}  


  })
  });

  socket.on("rejected", async (callback) => {
    logger.info("rejected event triggered");
    verifyAdminRole(socket, callback, async () => {

try {
  
  const rejectedOrder = await Order.find({
    status: "rejected",
  }).sort({ createdAt: -1 });
  logger.info(`Retrieved rejected orders: ${rejectedOrder.length} orders`);
  callback(rejectedOrder);

} catch (error) {
  logger.error(`Error retrieving rejected orders: ${error.message}`);


}
  })
  });

  socket.on("pending", async (callback) => {
    logger.info("pending event triggered");
    try {
      
      const pendingOrder = await Order.find({
        status: "pending",
      }).sort({ createdAt: -1 });
      logger.info(`Retrieved pending orders: ${pendingOrder.length} orders`);
      callback(pendingOrder);
    } catch (error) {
      logger.error(`Error retrieving pending orders: ${error.message}`);

    }
  });

  socket.on("paid", async (callback) => {
    logger.info("paid event triggered");
    verifyAdminRole(socket, callback, async () => {

      try {
        
        const paidOrder = await Order.find({
          status: "paid",
        }).sort({ createdAt: -1 });
        logger.info(`Retrieved paid orders: ${paidOrder.length} orders`);

        callback(paidOrder);
      
      
      } catch (error) {
        logger.error(`Error retrieving paid orders: ${error.message}`);
      }
  })
  });




  socket.on("Admin:deleteProduct", async ({ productId }, callback) => {
    logger.info(`Admin deleteProduct triggered with productId: ${productId}`);
    verifyAdminRole(socket, callback, async () => {
      try {
        const product = await ProductService.deleteProduct(productId);
        logger.info(`Product deleted successfully with productId: ${productId}`);
        callback({ message:"deleted successfully" });
        io.emit("customer:deleteProduct", {
          status: "deleted",
          productId:product.productId,
          name:product.productName
        });
      } catch (error) {
        logger.error(`Error deleting product: ${error.message}`);
        callback({ success: false, error: "An error occurred" });
        socketErrorHandler(socket, error);
      }
    });
  });

  socket.on("Admin:updateProduct", async ({ productId,updatedData,name }, callback) => {
    logger.info(`Admin updateProduct triggered with productId: ${productId}, updatedData: ${JSON.stringify(updatedData)}`);
    verifyAdminRole(socket, callback, async () => {
      try {
        console.log(updatedData)
        const product = await ProductService.updateProduct(productId,updatedData);
        logger.info(`Product updated successfully with productId: ${productId}`);
        callback({ message:"updateProduct successfully" });
        io.emit("customer:updateProduct", {
          status: "updated",
          product:product,
          name
        });
      } catch (error) {
        logger.error(`Error updating product: ${error.message}`);
        callback({ success: false, error: "An error occurred" });
        socketErrorHandler(socket, error);
      }
    });
  });

  socket.on("Admin:createProduct", async ({ updateStatus,name }) => {
    logger.info(`Admin createProduct triggered with name: ${name}`);
    verifyAdminRole(socket, async () => {
      try {
    
    
        io.emit("customer:createProduct", {
          status: "created",
          productName:name
  
        });
      } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
     
        socketErrorHandler(socket, error);
      }
    });
  });



  socket.on("forceLogout", async ({ userId }, callback) => {
    try {
      logger.info(`forceLogout triggered for userId: ${userId}`);

      const user = await User.findById(userId);

      if (!user || !user.socketId) {
        callback({ success: false, error: "User not found or not connected" });
        return;
      }

      const userSocketId = user.socketId;

      // Get the user's socket connection (do not forcefully disconnect)
      const userSocket = io.sockets.sockets.get(userSocketId);

      if (userSocket) {
        // You can use an event to notify the user for a logout action
        userSocket.emit("forcedLogout", {
          message: "You have been logged out by the admin.",
        });

        // Perform additional steps if necessary, like logging the event or cleaning up
        logger.info(`User ${userId} has been logged out.`);

        callback({
          success: true,
          message: `User ${userId} has been logged out.`,
        });
      } else {
        callback({ success: false, error: "User socket not found" });
      }
    } catch (error) {
      logger.error(`Error forcing user logout for userId: ${userId}, error: ${error.message}`);
      callback({
        success: false,
        error: "An error occurred while forcing logout",
      });
    }
  });




}




module.exports = adminSocket;
