const fs = require("fs");
const { paths } = require("../config/paths");

function createMemoryStore(options = {}) {
  const memoryFile = options.memoryFile || paths.memoryFile;

  function readAll() {
    if (!fs.existsSync(memoryFile)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  }

  function writeAll(records) {
    fs.writeFileSync(
      memoryFile,
      JSON.stringify(records, null, 2)
    );
  }

  return {
    readAll,

    append(record) {
      const records = readAll();
      records.push(record);
      writeAll(records);
      return record;
    },

    update(predicate, updater) {
      const records = readAll();

      let updatedRecord = null;

      for (const record of records) {
        if (predicate(record)) {
          updater(record);
          updatedRecord = record;
          break;
        }
      }

      if (updatedRecord) {
        writeAll(records);
      }

      return updatedRecord;
    }
  };
}

module.exports = {
  createMemoryStore
};
