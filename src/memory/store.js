const fs = require("fs");
const { paths } = require("../config/paths");

function createMemoryStore(options = {}) {
  const memoryFile = options.memoryFile || paths.memoryFile;

  return {
    readAll() {
      // TODO: Replace JSON file storage with a queryable memory backend.
      if (!fs.existsSync(memoryFile)) {
        return [];
      }

      return JSON.parse(fs.readFileSync(memoryFile, "utf8"));
    },

    append(record) {
      const records = this.readAll();
      records.push(record);
      fs.writeFileSync(memoryFile, JSON.stringify(records, null, 2));

      return record;
    }
  };
}

module.exports = {
  createMemoryStore
};
