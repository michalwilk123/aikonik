// Schema generation and schema push are CLI tasks, never Worker tasks.
function migrationToolingUnavailable(): never {
  throw new Error("Run database migrations through the CLI, not the Worker.");
}

export const generateSQLiteDrizzleJson = migrationToolingUnavailable;
export const generateSQLiteMigration = migrationToolingUnavailable;
export const pushSQLiteSchema = migrationToolingUnavailable;
