const router = require("express").Router();
const auth = require("../middleware/auth");
const dashboard = require("../controllers/dashboardController");
router.get("/", auth, dashboard);
module.exports = router;
