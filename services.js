const { default: mongoose } = require("mongoose");
const Order = require("./models/Order");
const Product = require("./models/Product");
const User = require("./models/User");
const { SocketError } = require("./shared/socketErrorHandler");

const createNewOrder = async (productsItem, customerId, phoneNumber,username, comments) => {
  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error("Invalid customer ID format");
    }


    if (!Array.isArray(productsItem.productsIds) || productsItem.productsIds.length === 0) {
      throw new Error("No products provided for the order");
    }

    if (!productsItem.tableNumber) {
      throw new Error("Table number is required");
    }

    // Fetch products from database
    const productIds = productsItem.productsIds.map((item) => item.id);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      throw new Error("Some products are missing or invalid");
    }

    // Create product map
    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});

    // Build detailed products list and calculate total price
    let totalPrice = 0;

    const detailedProducts = productsItem.productsIds.reduce((details, item) => {
      const { id, quantity } = item;
      const product = productMap[id];

      if (product) {
        const price = product.Price;
        const total = price * quantity;

        totalPrice += total;

        details.push({
          id: product._id,
          name: product.Name,
          category: product.Category,
          image: product.Image,
          price: price,
          quantity: quantity,
          total: total,
        });
      }

      return details;
    }, []);


   

    // Create new order object
    const newOrder = {
      table: productsItem.tableNumber,
      products: detailedProducts,
      totalPrice,
      customerId,
      username,
      phoneNumber,
      comments,
    };



    console.log({newOrder})

    // Save order to database
    return await Order.create(newOrder);

  } catch (error) {
    console.error("Error creating order:", error.message);
    throw new SocketError("هناك مشكلة في إنشاء الطلب", 500); // Make sure SocketError is properly defined
  }
};


const getWaitingOrders = async () => {
  try {
    const orders = await Order.find({ status: "pending" })
      .populate("customerId", "username phoneNumber")
      .sort({ createdAt: -1 });

    return orders;
  } catch (error) {
   
    throw new SocketError(` هناك مشكلة في  الطلبات قيد الانتظار : ${error}`, 500);

  }
};

const handleRejection = async (orderId, reason) => {
  try {
    const update = { status: "rejected", reason: reason };
    await Order.findByIdAndUpdate(orderId, update, { new: true });
    console.log(`Order ${orderId} has been rejected successfully.`);
  } catch (error) {
    throw new SocketError(` هناك مشكلة في التعامل مع  رفض الطلب : ${error}`, 500);

  }
};

const handleSuccess = async (orderId) => {
  try {
    // Fetch the order to check its customer
    const order = await Order.findById(orderId).populate("customerId");

    if (!order) {
      console.error("Order not found");
      return;
    }

    // Check for approved orders for the same customer
    const approvalOrders = await Order.find({
      customerId: order.customerId._id,
      status: "approved",
    });

    if (approvalOrders.length > 0) {
      // Logic to merge items from this order into existing approved orders
      for (const approvedOrder of approvalOrders) {
        for (const product of order.products) {
          const existingProduct = approvedOrder.products.find(
            (p) => p.id.toString() === product._id.toString()
          );
          if (existingProduct) {
            // If the product already exists, increase the quantity and update total
            existingProduct.quantity += product.quantity;
            existingProduct.total += product.total;
          } else {
            approvedOrder.products.push(product);
          }
        }
        approvedOrder.totalPrice += order.totalPrice; // Update total price
        await approvedOrder.save();
      }

      console.log(`Merged order ${orderId} with existing approved orders.`);

      // Delete the pending order
      await Order.findByIdAndDelete(orderId);
      console.log(`Deleted pending order ${orderId}.`);
    } else {
      const update = { status: "approved" };
      await Order.findByIdAndUpdate(orderId, update, { new: true });
      console.log(`Order ${orderId} has been approved successfully.`);
    }
  } catch (error) {
    console.error("Error handling success:", error);
    throw new SocketError(` هناك مشكلة في التعامل مع  نجاح الطلب : ${error}`, 500);



  }
};

const handlePaid2 = async (orderId, customerId,tax) => {
  try {
    const pendingOrders = await Order.find({
      customerId: customerId,
      status: "pending",
    });

    if (pendingOrders.length > 0) {
      return {
        paymentStatus: "paymentBlockedDueToPendingOrders",
        message: `There are ${pendingOrders.length} pending orders. Please resolve them first.`,
      };
    } else {


      const update = { status: "paid",tax };
      await Order.findByIdAndUpdate(orderId, update, { new: true });

      console.log(`Order ${orderId} has been paid successfully.`);
      return {
        paymentStatus: "paid",
        message: `There isn't any pending order.`,
      };
    }
  } catch (error) {
    throw new SocketError(` هناك مشكلة في دفع الطلب: ${error}`, 500);
  }
};

const handlePaid = async (orderId, customerId, tax) => {
  try {
    const pendingOrders = await Order.find({
      customerId: customerId,
      status: "pending",
    });

    if (pendingOrders.length > 0) {
      return {
        paymentStatus: "paymentBlockedDueToPendingOrders",
        message: `There are ${pendingOrders.length} pending orders. Please resolve them first.`,
      };
    } else {
      // Fetch the order to get the current totalPrice
      const order = await Order.findById(orderId);
      
      if (!order) {
        return { paymentStatus: "failed", message: "Order not found." };
      }

      // Calculate the new total price with the tax
      const taxAmount = (order.totalPrice * tax) / 100;
      const newTotalPrice = order.totalPrice + taxAmount;

      // Update the order with the new total price and tax
      const update = {
        status: "paid",
        tax: tax,
        totalPrice: newTotalPrice, // Update the total price with the new value
      };

      await Order.findByIdAndUpdate(orderId, update, { new: true });

      console.log(`Order ${orderId} has been paid successfully with tax applied.`);

      return {
        paymentStatus: "paid",
        message: `There isn't any pending order. Total price updated with tax.`,
      };
    }
  } catch (error) {
    throw new SocketError(`هناك مشكلة في دفع الطلب: ${error}`, 500);
  }
};

const PendingOrdersForCustomer = async (customerId) => {
  try {
    const orders = await Order.find({
      customerId: customerId,
      status: "pending",
    })
      .populate("customerId", "username email")
      .sort({ createdAt: -1 });
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new SocketError("هناك مشكلة في جلب الطلبات", 500);
  }
};

const addProductInOrder = async (productsItems, orderId, comments) => {
  try {
    const productIds = productsItems.map((item) => item.id);
    const newProducts = await Product.find({ _id: { $in: productIds } });

    const order = await Order.findById(orderId).populate("products");
    if (!order) throw new Error(`Order with ID ${orderId} not found.`);

    const existingProductsMap = order.products.reduce((acc, p) => {
      acc[p.id.toString()] = p;
      return acc;
    }, {});

    let totalPrice = 0;
    const updatedProductsMap = { ...existingProductsMap }; // Create a copy to update

    productsItems.forEach((item) => {
      const { id, quantity } = item;
      const product = newProducts.find((p) => p._id.toString() === id);

      if (product) {
        const price = product.Price;
        const total = price * quantity;

        if (updatedProductsMap[id]) {
          updatedProductsMap[id].quantity += quantity;
          updatedProductsMap[id].total =
            updatedProductsMap[id].price * updatedProductsMap[id].quantity;
        } else {
          // Add new product
          updatedProductsMap[id] = {
            id: product._id,
            name: product.Name,
            CATEGORY: product.Category,
            image: product.Image,
            price: product.Price,
            quantity,
            total,
          };
        }
      }
    });

    // Convert the updatedProductsMap to an array
    const finalProductsList = Object.values(updatedProductsMap);

    // Calculate the totalPrice from the final list of products
    totalPrice = finalProductsList.reduce((sum, p) => sum + p.total, 0);

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { products: finalProductsList, totalPrice, comments: comments },
      { new: true }
    );

    // console.log("Updated order:", updatedOrder);
    return updatedOrder;
  } catch (error) {
    throw new SocketError("هناك مشكلة في تعديل الطلب", 500);
  }
};

const getAllUsersWithLatestSocket = async (callback) => {
  try {
    const users = await User.find().sort({ updatedAt: -1 });
    callback(users);
  } catch (error) {
    throw new SocketError("هناك مشكلة في احضار الزبائن", 500);
  }
};

const deleteUserById = async (userId) => {
  try {
    const user = await User.findById(userId); // Find the user to get their socket ID
    const result = await User.deleteOne({ _id: userId });

    if (result.deletedCount > 0) {
      // Return the customer's socket information
      return { socketId: user.socketId }; // Assuming the socket ID is stored in the user document
    } else {
      throw new SocketError("الزبون غير موجود", 404);
    }
  } catch (error) {
    throw new SocketError("هناك مشكلة في حذف الزبون", 500);
  }
};





module.exports = {
  getAllUsersWithLatestSocket,
  deleteUserById,
  handleSuccess,
  handleRejection,
  handlePaid,
  getWaitingOrders,
  createNewOrder,
  PendingOrdersForCustomer,
  addProductInOrder,
};
