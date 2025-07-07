// orderCustomer.test.js
const ioClient = require("socket.io-client");
const { createServer } = require("http");
const { initializeSocket } = require("../socket"); // Adjust path as per your project structure
const express = require("express");
const cookie = require("cookie");

let io;
let server;
let clientSocket;

const BASE_URL = "http://192.168.1.200:8091";

const cookieHeader = cookie.serialize("authToken", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODNkNjQ0ZTFjNWIwZjE5MDA1ZGNlNSIsInJvbGUiOiJDdXN0b21lciIsImlhdCI6MTczNjY5MzMxNiwiZXhwIjoxNzM2NzIyMTE2fQ.iQvLkZxIeXuhrk-ZEHPC3zB2DSySGxSy8l0htG2FDUM");

beforeAll((done) => {
  const app = express();
  server = createServer(app);
  io = initializeSocket(server);

  server.listen(8091, () => {
    clientSocket = ioClient.connect(BASE_URL, {
      transports: ["websocket"],
      extraHeaders: {
        Cookie: cookieHeader
      }
    });

    clientSocket.on("connect", () => {
      console.log("Client connected to server");
      done();
    });

    clientSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      done(error); // Fail test if connection error occurs
    });
  });
});

// Close the client and server after each test
afterAll(() => {
  if (clientSocket.connected) {
    clientSocket.disconnect();
  }
  io.close();
  server.close();
});

jest.setTimeout(10000); // Increase timeout to 10 seconds

describe("Socket.IO orderCustomer Event", () => {
  test("should emit and process 'orderCustomer' event successfully", (done) => {
    // Data to send with 'orderCustomer'
    const orderData = {
      tableNumber: "1",
      productsIds: [
        {
          id: "677d30d09b928594cade457f",
          quantity: 2,
        },
      ],
      customerId: "6783d644e1c5b0f19005dce5",
      phoneNumber: "1221212121",
      username: "ayham",
      comments: "",
    };

    // Emit 'orderCustomer' from client
    clientSocket.emit("orderCustomer", orderData, (response) => {
      console.log("Response from server:", response); // Log the server's response
      try {
        expect(response.success).toBe(true);
        expect(response.message).toBe("Order received");
        done(); // Call done to signal that the test is complete
      } catch (error) {
        done(error); // Pass the error if the assertions fail
      }
    });

    // Handle timeout case where no response is received
    setTimeout(() => {
      done(new Error("Test timed out. No response received from server."));
    }, 5000); // Timeout after 5 seconds
  });
});
