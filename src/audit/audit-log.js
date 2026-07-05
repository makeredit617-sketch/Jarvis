function createAuditLog(options = {}) {
  const sink = options.sink || (() => {});

  return {
    record(event) {
      // TODO: Persist immutable audit events outside process memory.
      const auditEvent = {
        ...event,
        timestamp: new Date().toISOString()
      };

      sink(auditEvent);
      return auditEvent;
    }
  };
}

module.exports = {
  createAuditLog
};
