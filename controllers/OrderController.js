const Order = require("../models/Order");
const OrderService = require("../services/OrderService");
const { printer: ThermalPrinter, types } = require("node-thermal-printer");
const fs = require("fs").promises;
const { validateOrder } = require("../validators/OrderValidator");
const QRCode = require("qrcode");
const moment = require("moment");

const logger = require("../middlewares/logger");

exports.createOrder = async (req, res) => {
  try {
    logger.info("Creating a new order", { requestBody: req.body });

    // Validate request data
    const { error } = validateOrder(req.body);
    if (error) {
      logger.warn("Validation failed", { error: error.details[0].message });

      return res.status(400).json({ error: error.details[0].message });
    }

    const order = await OrderService.createOrder(req.body);
    logger.info("Order created successfully", { orderId: order._id });
    res.status(201).json(order);
  } catch (error) {
    logger.error("Error creating order", {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    logger.info("Fetching order by ID", { orderId: req.params.id });

    const order = await OrderService.getOrderById(req.params.id);
    if (!order) {
      logger.warn("Order not found", { orderId: req.params.id });

      return res.status(404).json({ error: "Order not found" });
    }
    logger.info("Order found", { orderId: order._id });
    res.status(200).json(order);
  } catch (error) {
    logger.error("Error fetching order by ID", {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    logger.info(
      `Request received at getAllOrders: ${JSON.stringify(req.query)}`
    );
    const options = {
      page: req.query.page || null,
      limit: req.query.limit || null,
      search: req.query.search || null,
      paginate: req.query.paginate || false,
    };

    logger.info(`Options for fetching orders: ${JSON.stringify(options)}`);
    const orders = await OrderService.getAllOrders(req.query, options);
    logger.info(
      `Fetched orders successfully: ${orders.length} orders retrieved`
    );

    res.status(200).json(orders);
  } catch (error) {
    logger.error(`Error fetching orders: ${error.message}`);

    res.status(400).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    logger.info(
      `Request received to update order: ${JSON.stringify(
        req.params
      )} with body: ${JSON.stringify(req.body)}`
    );
    const { error } = validateOrder(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.info(`Updating order with ID: ${req.params.id}`);

    const updatedOrder = await OrderService.updateOrder(
      req.params.id,
      req.body
    );
    if (!updatedOrder) {
      logger.warn(`Order not found: ${req.params.id}`);
      return res.status(404).json({ error: "Order not found" });
    }
    logger.info(`Order updated successfully: ${JSON.stringify(updatedOrder)}`);

    res.status(200).json(updatedOrder);
  } catch (error) {
    logger.error(`Error updating order: ${error.message}`);

    res.status(400).json({ error: error.message });
  }
};





exports.deleteOrder = async (req, res) => {
  try {
    logger.info(`Request received to delete order with ID: ${req.params.id}`);

    const result = await OrderService.deleteOrder(req.params.id);
    if (!result){ logger.warn(`Order not found for ID: ${req.params.id}`); return res.status(404).json({ error: "هذا الطلب غير موجود" });}
    logger.info(`Order deleted successfully with ID: ${req.params.id}`);

    res.status(204).send({ message: "تم الحذف بنجاح" });
  } catch (error) {
    logger.error(`Error deleting order with ID: ${req.params.id}, Error: ${error.message}`);

    res.status(400).json({ error: error.message });
  }
};



exports.deleteOrderByCustomerId = async (req, res) => {
  try {
    logger.info(`Request received to delete order for customer ID: ${req.params.customerId}`);

    const result = await OrderService.deleteOrderByCustomerId(
      req.params.customerId
    );

    
    if (!result)
{         logger.warn(`No order found for customer ID: ${req.params.customerId}`);
    return res.status(404).json({ error: "هذا الطلب غير موجود" });
}   
logger.info(`Order deleted successfully for customer ID: ${req.params.customerId}`);

res.status(204).send({ message: "تم الحذف بنجاح" });
  } catch (error) {
    logger.error(`Error deleting order for customer ID: ${req.params.customerId}, Error: ${error.message}`);

    res.status(400).json({ error: error.message });
  }
};


exports.getOrderByCustomerId = async (req, res) => {
  try {
    logger.info(`Request received to get order for customer ID: ${req.params.customerId}`);

    const order = await OrderService.getOrderByCustomerId(
      req.params.customerId
    );
    logger.info(`Order retrieved successfully for customer ID: ${req.params.customerId}`);

    res.status(200).send(order);
  } catch (error) {
    logger.error(`Error retrieving order for customer ID: ${req.params.customerId}, Error: ${error.message}`);

    res.status(400).json({ error: error.message });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    logger.info('Request received to get top products for the past week');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const topProducts = await Order.aggregate([
      // Match orders created within the last week
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      // Unwind the products array to process each product separately
      { $unwind: "$products" },
      // Group by product id and calculate total quantity
      {
        $group: {
          _id: "$products.id", // Group by product ID
          name: { $first: "$products.name" },
          image: { $first: "$products.image" },
          totalOrdered: { $sum: "$products.quantity" },
        },
      },
      // Sort by totalOrdered in descending order
      { $sort: { totalOrdered: -1 } },
      // Limit to top 3 products
      { $limit: 3 },
    ]);
    logger.info('Top products retrieved successfully');

    res.status(200).json({ success: true, topProducts });
  } catch (error) {
    logger.error(`Error retrieving top products: ${error.message}`);

    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};






exports.printingf = async (req, res) => {
  try {
    const { orderId, printerType, printerInterface,tax } = req.params;

    // Get the printer type and interface from the request params
    const type = types[printerType.toUpperCase()] || types.EPSON; // Default to EPSON if not found
    const interfaceAddress = printerInterface || "tcp://192.168.1.100:9100"; // Default IP if not provided

    const printer = new ThermalPrinter({
      type: type,
      interface: interfaceAddress,
    });

    // Fetch the order by ID and populate product details
    const order = await Order.findById(orderId).populate("products.id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if printer is available
    try {
      // Test if the printer can connect (this will throw an error if it can't connect)
      await printer.isPrinterConnected(); // You can also check if it throws an error here
    } catch (error) {
      console.error("Printer not reachable:", error);
      return res
        .status(500)
        .json({ message: "Error: Printer not connected or unreachable" });
    }

    // Start printing
    printer.alignCenter();
    printer.println("*************************************");
    printer.println("       Four Seasons Restaurant       ");
    printer.println("*************************************");
    printer.alignLeft();
    printer.println("             Order Details           ");
    printer.println(`Table: ${order.table || "N/A"}`);
    printer.println(`Customer: ${order.username || "N/A"}`);
    printer.println(`Phone: ${order.phoneNumber || "N/A"}`);
    printer.println("-------------------------------------");

    // Print product details
    order.products.forEach((product) => {
      if (product.name && product.price) {
        printer.println(`* ${product.name} x${product.quantity}`);
        printer.println(`  Price: ${product.price.toFixed(2)} SP`);
        printer.println(
          `  Total: ${(product.quantity * product.price).toFixed(2)} SP`
        );
      } else {
        console.error("Product missing required fields:", product);
        printer.println("* Product info missing");
      }
    });

    printer.println("-------------------------------------");
    printer.println(`Grand Total: ${order.totalPrice.toFixed(2)} SP`);
    printer.println("-------------------------------------");
    printer.println("       Thank you for dining with us! ");
    printer.println("         We hope to see you again.   ");
    printer.println("*************************************");

    // Generate and print QR Code
    try {
      const qrCodeText = await QRCode.toString(order._id.toString(), {
        type: "utf8",
      });
      printer.println("             Order QR Code           ");
      printer.println("-------------------------------------");
      printer.println(`${qrCodeText}`);
      printer.println("-------------------------------------");
    } catch (qrError) {
      console.error("QR code generation failed:", qrError);
      printer.println("  QR Code could not be generated.");
    }

    // Simulate cutting the paper
    printer.cut();

    // Execute the print job
    const isPrinted = await printer.execute();

    if (isPrinted) {
      res.status(200).json({ message: "Order printed successfully" });
    } else {
      console.error("Printing failed.");
      res.status(500).json({ message: "Printing failed" });
    }
  } catch (error) {
    console.error("Error printing order:", error);
    if (error.message.includes("Socket timeout")) {
      return res
        .status(500)
        .json({
          message:
            "Printer connection timeout. Please check the printer connection.",
        });
    } else if (error.message.includes("Encoding not recognized")) {
      return res
        .status(500)
        .json({
          message:
            "Error: Encoding not recognized - Check printer configuration",
        });
    }
    res.status(500).json({ message: "Server error while printing order" });
  }
};

exports.printing = async (req, res) => {
  try {
    const { orderId, printerType, printerInterface, tax } = req.params;

    // Get the printer type and interface from the request params
    const type = types[printerType.toUpperCase()] || types.EPSON; // Default to EPSON if not found
    const interfaceAddress = printerInterface || "tcp://192.168.1.100:9100"; // Default IP if not provided

    console.log(type, interfaceAddress);

    // Fetch the order by ID
    const order = await Order.findById(orderId).populate("products.id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Calculate the subtotal (sum of all product totals)
    let subtotal = 0;
    order.products.forEach((product) => {
      subtotal += product.quantity * product.price;
    });

    // Parse the tax as a float (percentage)
    const taxPercentage = parseFloat(tax) || 0;

    // Calculate the tax and grand total
    const taxAmount = (subtotal * taxPercentage) / 100;
    const grandTotal = subtotal + taxAmount;

    // Prepare QR code text
    const qrCodeText = await QRCode.toString(order._id.toString(), {
      type: "utf8",
    });

    let printOutput = "";

    // Add restaurant name with a luxurious header
    printOutput += "*************************************\n";
    printOutput += "       Four Seasons Restaurant       \n";
    printOutput += "*************************************\n";
    printOutput += `             ORDER ${order._id.toString()}             \n`;
    printOutput += "-------------------------------------\n";
    printOutput += "             Order Details           \n";
    printOutput += "-------------------------------------\n";
    printOutput += `Table: ${order.table}\n`;
    printOutput += `Customer: ${order.username || "N/A"}\n`;
    printOutput += `Phone: ${order.phoneNumber || "N/A"}\n`;
    printOutput += "-------------------------------------\n";

    order.products.forEach((product) => {
      printOutput += `* ${product.name} x${product.quantity}\n`;
      printOutput += `  Price: ${product.price.toFixed(2)} SP \n`;
      printOutput += `  Total: ${(product.quantity * product.price).toFixed(2)} SP \n`;
    });

    printOutput += "-------------------------------------\n";
    printOutput += `TAX: ${taxPercentage.toFixed(2)}% \n`;
    printOutput += `Tax Amount: ${taxAmount.toFixed(2)} SP \n`;
    printOutput += "-------------------------------------\n";
    printOutput += `Grand Total: ${grandTotal.toFixed(2)} SP \n`;
    printOutput += "-------------------------------------\n";
    printOutput += "       Thank you for dining with us! \n";
    printOutput += "         We hope to see you again.   \n";
    printOutput += "*************************************\n";

    printOutput += "             Order QR Code           \n";
    printOutput += "-------------------------------------\n";
    printOutput += `${qrCodeText}\n`;
    printOutput += "-------------------------------------\n";

    // Simulate cutting the paper
    printOutput += "------------- Cut Here -------------\n";

    // Write to a text file
    await fs.writeFile("./simulated_printer_output.txt", printOutput);

    // Simulate successful printing
    console.log("Simulated print executed successfully!");
    res.status(200).json({ message: "Order simulated print successful" });
  } catch (error) {
    console.error("Error printing order:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getStatistics = async (req, res) => {
  try {

    
    const { year, month } = req.query; // Get year and month from query parameters
    logger.info(`Received request for statistics. Year: ${year}, Month: ${month}`);

    const yearFilter = year
      ? {
          createdAt: {
            $gte: moment(`${year}-01-01`).startOf("year").toDate(),
            $lt: moment(`${parseInt(year) + 1}-01-01`)
              .startOf("year")
              .toDate(),
          },
        }
      : {};

    const monthFilter = month
      ? {
          createdAt: {
            $gte: moment(`${year}-${month}-01`).startOf("month").toDate(),
            $lt: moment(`${year}-${month}-01`).endOf("month").toDate(),
          },
        }
      : {};

    const finalFilter = { ...yearFilter, ...monthFilter };
    logger.info('Filter applied:', finalFilter);

    const totalOrders = await Order.countDocuments(finalFilter);
    const totalPaidOrders = await Order.countDocuments({
      ...finalFilter,
      status: "paid",
    });
    const totalpendingOrders = await Order.countDocuments({
      ...finalFilter,
      status: "pending",
    });
    const totalrejectedOrders = await Order.countDocuments({
      ...finalFilter,
      status: "rejected",
    });
    const totalapprovedOrders = await Order.countDocuments({
      ...finalFilter,
      status: "approved",
    });

    // Fetch total revenue
    const totalRevenue = await Order.aggregate([
      { $match: { ...finalFilter, status: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);

    // Fetch total paid vs unpaid orders
    const ordersByPaymentStatus = await Order.aggregate([
      { $match: { ...finalFilter, status: "paid" } },
      {
        $group: {
          _id: "$paid",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    // Fetch total orders by status (paid, approved, rejected, pending)
    const ordersByStatus = await Order.aggregate([
      { $match: finalFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Fetch top products by quantity
    const topProducts = await Order.aggregate([
      { $match: { ...finalFilter, status: "paid" } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.name",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$products.quantity", "$products.price"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // Fetch most sold product by quantity
    const mostSoldProduct = await Order.aggregate([
      { $match: { ...finalFilter, status: "paid" } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.name",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$products.quantity", "$products.price"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 1 },
    ]);

    // Fetch monthly revenue for each year (apply year and month filter if provided)
    const monthlyRevenue = await Order.aggregate([
      { $match: { ...finalFilter, status: "paid" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Fetch monthly total orders (to visualize order trends)
    const monthlyOrders = await Order.aggregate([
      { $match: { ...finalFilter, status: "paid" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Calculate Average Order Value (AOV)
    const averageOrderValue = totalRevenue[0]?.totalRevenue / totalOrders;

    // Fetch customer metrics
    const uniqueCustomers = await Order.distinct("userId");
    logger.info('Statistics fetched successfully.');

    // Respond with the statistics
    res.status(200).json({
      totalOrders,
      totalPaidOrders,
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      ordersByPaymentStatus,
      totalpendingOrders,
      totalrejectedOrders,
      totalapprovedOrders,
      ordersByStatus,
      topProducts,
      mostSoldProduct: mostSoldProduct[0] || null,
      monthlyRevenue,
      monthlyOrders,
      averageOrderValue,
      uniqueCustomersCount: uniqueCustomers.length,
    });
  } catch (error) {
    console.error(error);
    logger.error('Error fetching statistics:', error.message);

    res.status(500).json({ message: "Error fetching statistics" });
  }
};


exports.deleteAllOrderUser = async (req, res) => {


  const { customerId } = req.params;
  logger.info("delete All Order User", { customerId });


  try {
    // Validate that customerId is provided
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required." });
    }

    // Delete all orders for the specified user
    const result = await Order.deleteMany({ customerId });

    // Check if any orders were deleted
    if (result.deletedCount === 0) {
      logger.info("No orders found for the specified user", { customerId });
      return res.status(404).json({ message: "No orders found for the specified user." });
    }

    logger.info("Orders deleted successfully", { customerId, deletedCount: result.deletedCount });
    return res.status(200).json({ message: `${result.deletedCount} orders deleted successfully.` });
  } catch (error) {
    logger.error("Error deleting orders:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
