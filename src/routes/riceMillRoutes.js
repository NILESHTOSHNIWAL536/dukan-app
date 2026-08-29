const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/riceMillController");
router.use(auth);
router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);
module.exports = router;
