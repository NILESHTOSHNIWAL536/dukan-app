const Client = require("../models/Client");
const { cleanPhone, cleanString } = require("../utils/normalize");

const normalizeContacts = (body) => {
  const contacts = Array.isArray(body.contacts)
    ? body.contacts
    : [
        { name: body.mobileName1, mobileNumber: body.mobile1 || body.phone, primary: true },
        { name: body.mobileName2, mobileNumber: body.mobile2, primary: false },
      ];

  return contacts
    .map((contact, index) => ({
      name: cleanString(contact?.name),
      mobileNumber: cleanPhone(contact?.mobileNumber || contact?.mobile || contact?.phone),
      primary: index === 0 || Boolean(contact?.primary),
    }))
    .filter((contact) => contact.mobileNumber.length === 10);
};

function payload(body) {
  const contacts = normalizeContacts(body);
  const phones = contacts.map((contact) => contact.mobileNumber);
  return {
    name: cleanString(body.name || body.clientName),
    state: cleanString(body.state),
    district: cleanString(body.district),
    address: cleanString(body.address),
    gstNumber: cleanString(body.gstNumber || body.gstin).toUpperCase(),
    notes: cleanString(body.notes),
    contacts,
    phones,
    phone: phones[0] || "",
  };
}

async function list(req, res) {
  res.json(await Client.find({ owner: req.user.id }).sort({ state: 1, district: 1, name: 1 }));
}

async function create(req, res) {
  const data = payload(req.body);
  if (!data.name || !data.state || !data.district || !data.phones.length) {
    return res.status(400).json({ message: "Client name, state, district and one mobile number are required" });
  }
  res.status(201).json(await Client.create({ ...data, owner: req.user.id }));
}

async function update(req, res) {
  const data = payload(req.body);
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    data,
    { new: true, runValidators: true }
  );
  if (!client) return res.status(404).json({ message: "Client not found" });
  res.json(client);
}

async function remove(req, res) {
  const deleted = await Client.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Client not found" });
  res.status(204).end();
}

module.exports = { list, create, update, remove };
