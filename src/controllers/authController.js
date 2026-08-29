const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");

const cleanPhone = (value = "") => String(value).replace(/\D/g, "").slice(-10);

function publicUser(user) {
  return {
    id: user.id,
    officeName: user.officeName,
    ownerName: user.ownerName,
    contacts: user.contacts,
    email: user.email,
    address: user.address,
    state: user.state,
    district: user.district,
    pincode: user.pincode,
    gstin: user.gstin,
    officeLogo: user.officeLogo,
  };
}

async function signup(req, res) {
  const {
    officeName, ownerName, contacts, email, address,
    state, district, pincode, gstin, password, officeLogo
  } = req.body;

  if (!officeName?.trim() || !ownerName?.trim() || !email?.trim() ||
      !state?.trim() || !district?.trim() || !password) {
    return res.status(400).json({
      message: "Office name, owner name, email, state, district and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const exists = await User.exists({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: "An account with this email already exists" });

  const normalizedContacts = Array.isArray(contacts)
    ? contacts.map((c) => ({
        name: String(c?.name || "Contact").trim(),
        mobileNumber: cleanPhone(c?.mobileNumber),
        primary: Boolean(c?.primary),
      })).filter((c) => c.mobileNumber.length === 10)
    : [];

  if (!normalizedContacts.length) {
    return res.status(400).json({ message: "At least one valid 10 digit mobile number is required" });
  }
  normalizedContacts[0].primary = true;

  const user = await User.create({
    officeName: officeName.trim(),
    ownerName: ownerName.trim(),
    contacts: normalizedContacts,
    email: normalizedEmail,
    address: String(address || "").trim(),
    state: state.trim(),
    district: district.trim(),
    pincode: String(pincode || "").trim(),
    gstin: String(gstin || "").trim().toUpperCase(),
    officeLogo: officeLogo || null,
    password: await bcrypt.hash(password, 12),
  });

  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

async function login(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  return res.json({ token: signToken(user), user: publicUser(user) });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(publicUser(user));
}

module.exports = { signup, login, me };
