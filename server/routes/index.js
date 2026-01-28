const router = require("express").Router();
const { userVerification } = require('../middleware/authMiddleware')
const { notifications } = require("../controllers/notificationController");
const authRoutes = require("./authRoutes");
const friendRoutes = require("./friendRoutes");
const qrRoutes = require("./qrRoutes");
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");


router.get('/',userVerification)

router.get('/notifications',userVerification,notifications)

router.use("/", authRoutes);
router.use("/", friendRoutes);
router.use("/", qrRoutes);
router.use("/", userRoutes);
router.use("/", postRoutes);


module.exports = router;