const fs = require("fs");

function readValueFromFile(filePath) {
  if (!filePath) {
    return null;
  }

  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch (error) {
    console.warn(`Failed to read env file at ${filePath}: ${error.message}`);
    return null;
  }
}

function getEnvValue(name, fallback = undefined) {
  const directValue = process.env[name];
  if (typeof directValue === "string" && directValue.length > 0) {
    return directValue;
  }

  const fromFile = readValueFromFile(process.env[`${name}_FILE`]);
  if (typeof fromFile === "string" && fromFile.length > 0) {
    return fromFile;
  }

  return fallback;
}

module.exports = {
  getEnvValue,
};
