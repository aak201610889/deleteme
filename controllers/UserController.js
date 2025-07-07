const UserService = require("../services/UserService");
const { decryptString } = require('./cryptoUtils');
const logger =require('../middlewares/logger')
exports.loginController = async (req, res) => {
  try {


    const { email, password } = req.body;
    logger.info('Login attempt', { email,password });
    const token = await UserService.login(email, password);

res.cookie("authToken", token, {
  httpOnly: true,
  secure: false,        // ✅ Required for HTTP
  sameSite: "lax",      // ✅ Needed for cross-origin
  maxAge: 10 * 365 * 24 * 60 * 60 * 1000
});
    logger.info('Login successful', { email });
    res.status(201).json("successLogin");
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    let { username, tableNumber, phoneNumber, password } = req.body;

    logger.info('User creation attempt', { username, tableNumber, phoneNumber });

 let tableNumberInt

if(tableNumber!="test"){

  // Decrypt the tableNumber if it's encrypted
  const decryptedTableNumber = decryptString(tableNumber);
  if (decryptedTableNumber !== null) {
    tableNumber = decryptedTableNumber.toString();
  }
  
  
  // Input validations
  if (password.length < 10 || password.length > 20) {
    logger.warn('Password length validation failed', { passwordLength: password.length });
    return res.status(400).json({ error: "يجب أن تكون كلمة المرور بين 10 و 20 حرفًا." });
  }
  
   tableNumberInt = parseInt(tableNumber, 10);
  if (isNaN(tableNumberInt)) {
    logger.warn('Table number is not a valid number', { tableNumber });
    return res.status(400).json({ error: "يجب أن يكون رقم الطاولة رقماً صحيحاً." });
  }
  
  
  
  if (tableNumberInt < 1 || tableNumberInt > 1000) {
    logger.warn('Table number validation failed', { tableNumber: tableNumberInt });
    return res.status(400).json({ error: "يجب أن يكون رقم الطاولة بين 1 و 1000." });
  }
}else{ 
console.log("=====++++++++++++")




  tableNumberInt="test"


}





    if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      logger.warn('Phone number validation failed', { phoneNumber });
      return res.status(400).json({ error: "يجب أن يتكون رقم الهاتف من 10 أرقام فقط." });
    }
    
    if (!/^[a-zA-Z]+$/.test(username) || username.length > 20) {
      logger.warn('Username validation failed', { username });
      return res.status(400).json({ error: "يجب أن يحتوي اسم المستخدم على أحرف فقط ولا يزيد عن 20 حرفًا." });
    }

    // Call service to create user with decrypted table number
    const token = await UserService.createUser(
      username,
      tableNumberInt,
      phoneNumber,
      password
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      sameSite: "none",
      secure: true,
    });
    
    logger.info('User created successfully', { username });
    res.status(201).json({
      message: "User created successfully",
      token,
    });
  } catch (error) {
    logger.error('User creation failed', { error: error.message });
    console.error(error);
    res.status(400).json({
      error: error.message || "An error occurred during user creation.",
    });
  }
};


















exports.logout = (req, res) => {
  try {
    
    res.clearCookie("authToken", {
      httpOnly: true,
      sameSite: "strict",
    });
    logger.info('Admin logout successfully');
  
    res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    logger.error('Failed Admin Logout', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};

exports.signupAdmin = async (req, res) => {
  const { email, password, role } = req.body;
  logger.info('Admin signup attempt', { email, role });

  try {
    const user = await UserService.signupAdmin({ email, password, role });
    logger.info('Admin signed up successfully', { email });

    res.status(201).json(user);
  } catch (error) {
    logger.error('Failed Admin signed up', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};


exports.getAllUesrs = async (req, res) => {
  try {
    logger.info('Fetching all users');

    const users = await UserService.getAllUesrs();
    res.status(200).send(users);
  } catch (error) {
    logger.error('Failed to fetch users', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};

exports.getAllUserswithAdmin = async (req, res) => {
  try {
    logger.info('Fetching all users with admin roles');

    const users = await UserService.getAllUserswithAdmin();
    res.status(200).send(users);
  } catch (error) {
    logger.error('Failed to fetch users with admin roles', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};

const mongoose = require("mongoose");

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    logger.info('Fetching user by ID', { id });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    const deletedUser = await UserService.getUserById(id);
    res.status(200).send(deletedUser);
  } catch (error) {
    logger.error('Failed to fetch user by ID', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const id = req.params.id;
    logger.info('Deleting user by ID', { id });

    const user = await UserService.deleteUserById(id);
    logger.info('User deleted successfully', { id });
    res.status(201).send("حذف الزبون بنجاح");
  } catch (error) {
    logger.error('Failed to delete user', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};

exports.getUserTable = async (req, res) => {
  try {
    const { userId } = req.body;
    logger.info('Fetching user table', { userId });

    const users = await UserService.getUserTable(userId);
    res.status(200).send(users);
  } catch (error) {
    logger.error('Failed to fetch user table', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};

exports.getUserId = async (req, res) => {
  try {
    
    const  userId= req.user.id
    logger.info('Fetching user by ID', { userId });

    const users = await UserService.getUserId(userId);
    res.status(200).send(users);
  } catch (error) {
    logger.error('Failed to fetch user by ID', { error: error.message });

    res.status(400).json({ error: error.message });
  }
};
