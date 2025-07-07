const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const SECRETKEY20S=process.env.SECRETKEY20S||"$PsgyT72QFPKft&S&g%nJ$^^*mx%gKgZq"
exports.login = async (email, password) => {


  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid login credentials1");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid login credentials2");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    SECRETKEY20S
  );

  return  token;
};


 




exports.createUser = async (username, tableNumber, phoneNumber, password) => {
 
  if (!username || !tableNumber || !phoneNumber || !password) {
    throw new Error('جميع الحقول مطلوبة');
  }


  if (!/^\d{10}$/.test(phoneNumber)) {
    throw new Error('يجب أن يتكون رقم الهاتف من 10 أرقام فقط');
  }


let parsedTableNumber ;
if(tableNumber!="test"){

   parsedTableNumber = parseInt(tableNumber);
  if (isNaN(parsedTableNumber) || parsedTableNumber <= 0) {
    throw new Error('رقم الطاولة يجب أن يكون رقماً صحيحاً موجباً');
  }


  const existingReservation = await User.findOne({ 
    tableNumber: parsedTableNumber, 
    isReserved: true 
  });

  if (existingReservation) {
    return handleExistingReservation(existingReservation, {
      username,
      phoneNumber,
      password,
      tableNumber: parsedTableNumber
    });
  }


}
else{
  parsedTableNumber ="test"
}

  // If no existing reservation, create new user
  return createNewUser({
    username,
    tableNumber: parsedTableNumber,
    phoneNumber,
    password
  });
};

// Helper function to handle existing reservations
const handleExistingReservation = async (existingReservation, userData) => {
  const { username, phoneNumber, password, tableNumber } = userData;
  
  // Check if user exists with the same phone number
  const existingUser = await User.findOne({ phoneNumber });

  if (existingUser) {
    if (existingUser.tableNumber !== tableNumber) {
      throw new Error(`يوجد مستخدم ${existingUser.tableNumber} الرقم محجوز لطاولة أخرى`);
    }

    // Validate credentials for existing user
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (existingUser.username !== username || !isPasswordValid) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة للحجز الحالي');
    }

    // Return token for existing user
    return generateToken(existingUser._id, 'Customer');
  }

  throw new Error(`الطاولة ${tableNumber} محجوزة من قبل شخص آخر`);
};

// Helper function to create new user
const createNewUser = async (userData) => {
  const { username, tableNumber, phoneNumber, password } = userData;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      phoneNumber,
      tableNumber,
      isReserved: true,
      socketId: null
    });

    const savedUser = await newUser.save();
    return generateToken(savedUser._id, 'Customer');
  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error
      throw new Error('رقم الهاتف محجوز مسبقاً');
    }
    throw new Error(`خطأ في إنشاء المستخدم: ${error.message}`);
  }
};

// Helper function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.SECRETKEY20S || SECRETKEY20S,
    { expiresIn: '8h' }
  );
};



exports.signupAdmin = async (data) => {
  try {
    if (data.role !== '***') {
      throw "Please check your data";
    } else {
      const password = data.password;
      const hashedPassword = await bcrypt.hash(password, 8);

      const user = await User.create({
        ...data,
        role: "***",
        password: hashedPassword,
      });

      // Create a token with a very long expiration time (e.g., 10 years)
      const token = jwt.sign(
        { id: user._id, role: user.role },
        SECRETKEY20S,
        { expiresIn: "10y" } // Token will expire in 10 years
      );

      const userWithoutExtensions = user.toObject();
      delete userWithoutExtensions.password;
      delete userWithoutExtensions.role;

      return { user: userWithoutExtensions, token };
    }
  } catch (error) {
    return "Error is ====> " + error;
  }
};


exports.getAllUserswithAdmin = async () => {
  try {
    const users = await User.find({role:'***'}).sort({
      createdAt: -1
    });
    return users;
  } catch (error) {
    throw new Error(`Error retrieving users: ${error.message}`);
  }
};


exports.getAllUesrs = async () => {
  try {
    const users = await User.find({ role: { $ne: "***" } }).sort({
      createdAt: -1,
    });

    return users;
  } catch (error) {
    throw new Error(`Error retrieving users: ${error.message}`);
  }
};




exports.getUserById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }
    const deletedUser = await User.findById(id);
    if (!deletedUser) {
      throw new Error("User not found");
    }
    return deletedUser;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error(error.message);
  }
};

exports.deleteUserById = async (id) => {
  try {
    const userById = await User.findByIdAndDelete(id);

    return userById;
  } catch (error) {
    throw new Error(error);
  }
};

exports.getUserTable = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user.tableNumber) {
      return new Error("error You have other User Id please check with admin");
    } else {
      return user.tableNumber;
    }
  } catch (error) {
    throw new Error(error);
  }
};

exports.getUserId = async (id) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      return new Error("User not found. Please check with admin.");
    } else {
      return {userId:user._id,phoneNumber:user.phoneNumber,tableNumber:user.tableNumber,username:user.username};
    }
  } catch (error) {
    throw new Error(error.message || "An unexpected error occurred.");
  }
};
