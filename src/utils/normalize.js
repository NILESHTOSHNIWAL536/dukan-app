function cleanPhone(value = "") {
  return String(value).replace(/\D/g, "").slice(-10);
}

function cleanString(value = "") {
  return String(value ?? "").trim();
}

function parseIndianDate(value) {
  if (value instanceof Date) return value;
  const text = cleanString(value);
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return text ? new Date(text) : new Date();
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatIndianDate(date) {
  const value = date instanceof Date ? date : parseIndianDate(date);
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${value.getFullYear()}`;
}

module.exports = { cleanPhone, cleanString, parseIndianDate, formatIndianDate };
