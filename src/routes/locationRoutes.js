const router = require("express").Router();

router.get("/states", async (req, res) => {
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India" }),
    });
    const json = await response.json();
    res.status(response.ok ? 200 : 502).json(json);
  } catch {
    res.status(502).json({ message: "Unable to load states" });
  }
});

router.get("/districts", async (req, res) => {
  const state = String(req.query.state || "").trim();
  if (!state) return res.status(400).json({ message: "State is required" });
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India", state }),
    });
    const json = await response.json();
    res.status(response.ok ? 200 : 502).json(json);
  } catch {
    res.status(502).json({ message: "Unable to load districts" });
  }
});

module.exports = router;
