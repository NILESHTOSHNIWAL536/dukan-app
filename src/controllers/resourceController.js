function createResourceController(Model, fields) {
  const owner = (req) => ({ owner: req.user.id });

  return {
    list: async (req, res) => {
      res.json(await Model.find(owner(req)).sort({ createdAt: -1 }));
    },
    create: async (req, res) => {
      const data = {};
      for (const field of fields) {
        if (req.body[field] !== undefined) data[field] = typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
      }
      res.status(201).json(await Model.create({ ...data, owner: req.user.id }));
    },
    update: async (req, res) => {
      const data = {};
      for (const field of fields) {
        if (req.body[field] !== undefined) data[field] = typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
      }
      const item = await Model.findOneAndUpdate(
        { _id: req.params.id, ...owner(req) },
        data,
        { new: true, runValidators: true }
      );
      if (!item) return res.status(404).json({ message: "Record not found" });
      res.json(item);
    },
    remove: async (req, res) => {
      const item = await Model.findOneAndDelete({ _id: req.params.id, ...owner(req) });
      if (!item) return res.status(404).json({ message: "Record not found" });
      res.status(204).end();
    },
  };
}

module.exports = createResourceController;
