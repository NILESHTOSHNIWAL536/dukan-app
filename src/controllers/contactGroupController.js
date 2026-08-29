const ContactGroup = require("../models/ContactGroup");
const { cleanPhone, cleanString } = require("../utils/normalize");

function payload(body) {
  const contacts = (Array.isArray(body.contacts) ? body.contacts : [])
    .map((contact) => ({
      name: cleanString(contact?.name) || "Unknown Contact",
      mobile: cleanPhone(contact?.mobile || contact?.mobileNumber || contact?.phone),
    }))
    .filter((contact) => contact.mobile.length === 10);

  return {
    groupName: cleanString(body.groupName || body.phoneBookGroup?.groupName) || "Phone Book Group",
    contacts,
    contactId: cleanString(body.contactId),
    contactName: cleanString(body.contactName),
  };
}

async function list(req, res) {
  res.json(await ContactGroup.find({ owner: req.user.id }).sort({ createdAt: -1 }));
}

async function create(req, res) {
  const data = payload(req.body.phoneBookGroup || req.body);
  if (!data.contacts.length) return res.status(400).json({ message: "At least one valid contact is required" });
  res.status(201).json(await ContactGroup.create({ ...data, owner: req.user.id }));
}

async function update(req, res) {
  const data = payload(req.body.phoneBookGroup || req.body);
  if (!data.contacts.length) return res.status(400).json({ message: "At least one valid contact is required" });
  const group = await ContactGroup.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    data,
    { new: true, runValidators: true }
  );
  if (!group) return res.status(404).json({ message: "Contact group not found" });
  res.json(group);
}

async function remove(req, res) {
  const deleted = await ContactGroup.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Contact group not found" });
  res.status(204).end();
}

module.exports = { list, create, update, remove };
