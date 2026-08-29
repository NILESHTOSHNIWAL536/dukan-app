const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/paymentController");
router.use(auth);
router.get("/", controller.list);
router.post("/", controller.create);
module.exports = router;
