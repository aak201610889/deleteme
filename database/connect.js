const { default: mongoose } = require("mongoose");


 const DB_URL=process.env.MONGODB_URI
const chalk = require("chalk");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(chalk.bgGreen(`MongoDB connected`));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};
module.exports = connectDB;
