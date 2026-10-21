const fs = require("fs");
const path = require("path");

function getFilePath(fileName) {
  return path.join(
    __dirname,
    "..",
    "data",
    fileName
  );
}

function readJson(fileName) {
  try {
    const filePath = getFilePath(fileName);

    const content = fs.readFileSync(
      filePath,
      "utf8"
    );

    return JSON.parse(content);
  } catch (error) {
    console.error(
      `Read ${fileName} error:`,
      error.message
    );

    return [];
  }
}

function writeJson(fileName, data) {
  try {
    const filePath = getFilePath(fileName);

    fs.writeFileSync(
      filePath,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error(
      `Write ${fileName} error:`,
      error.message
    );
  }
}

module.exports = {
  readJson,
  writeJson,
};