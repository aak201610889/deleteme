const UserController = require("../controllers/UserController");
const { verifyToken } = require("../middlewares/authMiddleware");
const router = require("express").Router();

router.post("/", UserController.createUser);
 router.post('/admin/signupadmin2024', UserController.signupAdmin);
router.get("/", verifyToken("***"), UserController.getAllUesrs);
router.post("/admin/login", UserController.loginController);

router.get("/user-profile", verifyToken(), (req, res) => {


  res.json({ role: `${req.user.role}`, IdItem: `${req.user.id}` });
});

router.get("/getUser", verifyToken(), UserController.getUserId);
router.get(
  "/getAdminWithCustomer",
  verifyToken("***"),
  UserController.getAllUserswithAdmin
);
router.get("/:id", UserController.getUserById);
router.delete("/:id", verifyToken("***"), UserController.deleteUserById);
router.post('/logout',verifyToken("***"), UserController.logout);

module.exports = router;
