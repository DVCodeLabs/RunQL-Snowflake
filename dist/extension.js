"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode2 = __toESM(require("vscode"));

// src/provider.ts
var snowflakeProvider = {
  providerId: "snowflake",
  displayName: "Snowflake",
  dialect: "snowflake",
  formSchema: {
    fields: [
      {
        key: "snowflakeImportInput",
        label: "Auto-fill connection details",
        type: "textarea",
        tab: "connection",
        storage: "local",
        placeholder: 'jdbc:snowflake://ABCDEFG.XY12345.snowflakecomputing.com/?user=...\nOR\n[connections.example]\naccount = "..."',
        description: "Import Settings - Paste your JDBC/ODBC connection string or Snowflake TOML config snippet to auto-fill the connection details.",
        width: "full"
      },
      {
        key: "account",
        label: "Account",
        type: "text",
        tab: "connection",
        storage: "profile",
        required: true,
        placeholder: "ABCDEFG.XY12345",
        description: "Snowflake account identifier (e.g. ABCDEFG.XY12345). Do not include https:// or .snowflakecomputing.com",
        width: "full"
      },
      {
        key: "warehouse",
        label: "Warehouse",
        type: "text",
        tab: "connection",
        storage: "profile",
        required: true,
        width: "half"
      },
      {
        key: "role",
        label: "Role (Optional)",
        type: "text",
        tab: "connection",
        storage: "profile",
        width: "half"
      },
      {
        key: "database",
        label: "Database",
        type: "text",
        tab: "connection",
        storage: "profile",
        required: true,
        width: "half"
      },
      {
        key: "schema",
        label: "Schema",
        type: "text",
        tab: "connection",
        storage: "profile",
        width: "half"
      },
      {
        key: "authMode",
        label: "Authentication Mode",
        type: "select",
        tab: "auth",
        storage: "profile",
        defaultValue: "keypair",
        options: [
          { value: "keypair", label: "Key-Pair Authentication (Default)" }
        ],
        width: "full"
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        tab: "auth",
        storage: "profile",
        required: true,
        width: "full"
      },
      {
        key: "privateKeyPath",
        label: "Private Key File (PEM)",
        type: "file",
        tab: "auth",
        storage: "profile",
        required: true,
        placeholder: "/path/to/rsa_key.p8",
        visibleWhen: {
          storage: "profile",
          key: "authMode",
          equals: "keypair"
        },
        picker: {
          mode: "open",
          title: "Select Private Key",
          openLabel: "Select Private Key",
          canSelectFiles: true,
          canSelectFolders: false,
          filters: {
            "Key Files": ["p8", "pem", "key"],
            "All Files": ["*"]
          }
        },
        description: "Select your unencrypted or encrypted private key file.",
        width: "full"
      },
      {
        key: "privateKeyPassphrase",
        label: "Passphrase (Optional)",
        type: "password",
        tab: "auth",
        storage: "secrets",
        placeholder: "If private key is encrypted",
        visibleWhen: {
          storage: "profile",
          key: "authMode",
          equals: "keypair"
        },
        width: "full"
      }
    ],
    actions: [
      {
        id: "openInstructions",
        label: "Instructions for Snowflake Connections",
        tab: "connection",
        style: "link"
      },
      {
        id: "parseImport",
        label: "Parse & Fill",
        tab: "connection",
        style: "secondary",
        payloadKeys: ["snowflakeImportInput"]
      }
    ]
  },
  supports: {
    ssl: true,
    oauth: false,
    keypair: true,
    introspection: true,
    cancellation: true
  }
};

// src/snowflakeAdapter.ts
var snowflake = __toESM(require("snowflake-sdk"));
var CONNECTION_TIMEOUT_MS = 3e4;
var SNOWFLAKE_DOMAIN_SUFFIX = ".snowflakecomputing.com";
var SnowflakeAdapter = class {
  constructor() {
    this.dialect = "snowflake";
  }
  async testConnection(profile, secrets) {
    const conn = this.createConnection(profile, secrets);
    try {
      await this.connect(conn);
      await this.execute(conn, "SELECT 1");
    } finally {
      await this.destroy(conn);
    }
  }
  async runQuery(profile, secrets, sql, _options) {
    const conn = this.createConnection(profile, secrets);
    const start = Date.now();
    try {
      await this.connect(conn);
      const { rows, statement } = await this.executeWithStatement(conn, sql);
      const elapsedMs = Date.now() - start;
      const cols = statement.getColumns() ?? [];
      const columns = cols.map((c) => ({
        name: c.getName(),
        type: c.getType(),
        normalizedType: c.getType()
      }));
      return {
        columns,
        rows,
        rowCount: rows.length,
        elapsedMs
      };
    } finally {
      await this.destroy(conn);
    }
  }
  async executeNonQuery(profile, secrets, sql) {
    const conn = this.createConnection(profile, secrets);
    try {
      await this.connect(conn);
      const { rows, statement } = await this.executeWithStatement(conn, sql);
      const numRows = statement.getNumRows?.() ?? rows.length;
      return { affectedRows: numRows };
    } finally {
      await this.destroy(conn);
    }
  }
  async introspectSchema(profile, secrets) {
    const conn = this.createConnection(profile, secrets);
    try {
      await this.connect(conn);
      const schemaFilter = profile.schema?.trim();
      const targetDatabase = await this.getCurrentDatabase(conn);
      if (!targetDatabase) {
        throw new Error(
          "No Snowflake database could be resolved for this connection. Ensure the database exists and your role has USAGE privilege on it."
        );
      }
      const [columnRows, routineRows, parameterRows] = await Promise.all([
        this.execute(conn, this.buildColumnsIntrospectionSql(targetDatabase, schemaFilter)),
        this.execute(conn, this.buildRoutinesIntrospectionSql(targetDatabase, schemaFilter)),
        this.execute(conn, this.buildRoutineParametersSql(targetDatabase, schemaFilter))
      ]);
      const schemasMap = /* @__PURE__ */ new Map();
      const routinesBySpecificName = /* @__PURE__ */ new Map();
      for (const row of columnRows) {
        const schemaName = this.getRowString(row, ["TABLE_SCHEMA", "table_schema"]);
        const tableName = this.getRowString(row, ["TABLE_NAME", "table_name"]);
        const columnName = this.getRowString(row, ["COLUMN_NAME", "column_name"]);
        const dataType = this.getRowString(row, ["DATA_TYPE", "data_type"]) || "UNKNOWN";
        const nullableRaw = this.getRowString(row, ["IS_NULLABLE", "is_nullable"]) || "";
        const columnComment = this.getRowString(row, ["COMMENT", "comment"]);
        if (!schemaName || !tableName || !columnName) {
          continue;
        }
        if (!schemasMap.has(schemaName)) {
          schemasMap.set(schemaName, { name: schemaName, tables: /* @__PURE__ */ new Map(), procedures: [], functions: [] });
        }
        const schema = schemasMap.get(schemaName);
        if (!schema.tables.has(tableName)) {
          schema.tables.set(tableName, {
            name: tableName,
            columns: [],
            foreignKeys: []
          });
        }
        const table = schema.tables.get(tableName);
        table.columns.push({
          name: columnName,
          type: dataType,
          nullable: nullableRaw.toUpperCase() === "YES",
          comment: columnComment || void 0
        });
      }
      for (const row of routineRows) {
        const schemaName = this.getRowString(row, ["ROUTINE_SCHEMA", "routine_schema"]);
        const routineName = this.getRowString(row, ["ROUTINE_NAME", "routine_name"]);
        const routineTypeRaw = this.getRowString(row, ["ROUTINE_TYPE", "routine_type"]) ?? "";
        const specificName = this.getRowString(row, ["SPECIFIC_NAME", "specific_name"]);
        const returnType = this.getRowString(row, ["DATA_TYPE", "data_type"]);
        if (!schemaName || !routineName) {
          continue;
        }
        if (!schemasMap.has(schemaName)) {
          schemasMap.set(schemaName, { name: schemaName, tables: /* @__PURE__ */ new Map(), procedures: [], functions: [] });
        }
        const schema = schemasMap.get(schemaName);
        const kind = routineTypeRaw.toUpperCase() === "PROCEDURE" ? "procedure" : "function";
        const routine = {
          name: routineName,
          kind,
          returnType: kind === "function" ? returnType || void 0 : void 0,
          parameters: []
        };
        if (kind === "procedure") {
          schema.procedures.push(routine);
        } else {
          schema.functions.push(routine);
        }
        const keyName = specificName || routineName;
        routinesBySpecificName.set(this.routineSpecificKey(schemaName, keyName), routine);
      }
      for (const row of parameterRows) {
        const schemaName = this.getRowString(row, ["SPECIFIC_SCHEMA", "specific_schema"]);
        const specificName = this.getRowString(row, ["SPECIFIC_NAME", "specific_name"]);
        const modeRaw = this.getRowString(row, ["PARAMETER_MODE", "parameter_mode"]);
        const dataType = this.getRowString(row, ["DATA_TYPE", "data_type"]);
        const ordinalPosition = this.getRowNumber(row, ["ORDINAL_POSITION", "ordinal_position"]);
        const parameterNameRaw = this.getRowString(row, ["PARAMETER_NAME", "parameter_name"]);
        if (!schemaName || !specificName) {
          continue;
        }
        const routine = routinesBySpecificName.get(this.routineSpecificKey(schemaName, specificName));
        if (!routine) {
          continue;
        }
        const mode = this.normalizeParameterMode(modeRaw);
        const position = typeof ordinalPosition === "number" ? ordinalPosition : void 0;
        const generatedName = position ? `arg${position}` : "arg";
        const parameterName = parameterNameRaw?.trim() || (mode === "return" ? "return_value" : generatedName);
        routine.parameters = routine.parameters ?? [];
        routine.parameters.push({
          name: parameterName,
          mode,
          type: dataType || void 0,
          position
        });
        if (!routine.returnType && mode === "return" && dataType) {
          routine.returnType = dataType;
        }
      }
      for (const schema of schemasMap.values()) {
        const sortRoutine = (a, b) => a.name.localeCompare(b.name) || (a.signature || "").localeCompare(b.signature || "");
        for (const routine of [...schema.procedures, ...schema.functions]) {
          if (routine.parameters && routine.parameters.length > 0) {
            routine.parameters.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          }
          routine.signature = this.buildRoutineSignature(routine);
        }
        schema.procedures.sort(sortRoutine);
        schema.functions.sort(sortRoutine);
      }
      const schemas = Array.from(schemasMap.values()).sort((a, b) => a.name.localeCompare(b.name)).map((schema) => ({
        name: schema.name,
        tables: Array.from(schema.tables.values()).sort((a, b) => a.name.localeCompare(b.name)),
        procedures: schema.procedures,
        functions: schema.functions
      }));
      return {
        version: "0.2",
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        connectionId: profile.id,
        connectionName: profile.name,
        dialect: "snowflake",
        schemas
      };
    } finally {
      await this.destroy(conn);
    }
  }
  async getCurrentDatabase(conn) {
    try {
      const rows = await this.execute(conn, "SELECT CURRENT_DATABASE() AS CURRENT_DATABASE");
      if (!rows || rows.length === 0) {
        return void 0;
      }
      return this.getRowString(rows[0], ["CURRENT_DATABASE", "current_database"]);
    } catch {
      return void 0;
    }
  }
  buildColumnsIntrospectionSql(databaseName, schemaFilter) {
    const db = this.quoteIdentifier(databaseName);
    let sql = `
      SELECT
        TABLE_CATALOG,
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COMMENT
      FROM ${db}.INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA NOT IN ('INFORMATION_SCHEMA', 'DELETED')
    `;
    if (schemaFilter) {
      const escapedSchema = schemaFilter.toUpperCase().replace(/'/g, "''");
      sql += ` AND TABLE_SCHEMA = '${escapedSchema}'`;
    }
    sql += " ORDER BY TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION";
    return sql;
  }
  buildRoutinesIntrospectionSql(databaseName, schemaFilter) {
    const db = this.quoteIdentifier(databaseName);
    let sql = `
      SELECT
        ROUTINE_SCHEMA,
        ROUTINE_NAME,
        SPECIFIC_NAME,
        ROUTINE_TYPE,
        DATA_TYPE
      FROM ${db}.INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_SCHEMA NOT IN ('INFORMATION_SCHEMA')
    `;
    if (schemaFilter) {
      const escapedSchema = schemaFilter.toUpperCase().replace(/'/g, "''");
      sql += ` AND ROUTINE_SCHEMA = '${escapedSchema}'`;
    }
    sql += " ORDER BY ROUTINE_SCHEMA, ROUTINE_NAME, SPECIFIC_NAME";
    return sql;
  }
  buildRoutineParametersSql(databaseName, schemaFilter) {
    const db = this.quoteIdentifier(databaseName);
    let sql = `
      SELECT
        SPECIFIC_SCHEMA,
        SPECIFIC_NAME,
        PARAMETER_NAME,
        PARAMETER_MODE,
        DATA_TYPE,
        ORDINAL_POSITION
      FROM ${db}.INFORMATION_SCHEMA.PARAMETERS
      WHERE SPECIFIC_SCHEMA NOT IN ('INFORMATION_SCHEMA')
    `;
    if (schemaFilter) {
      const escapedSchema = schemaFilter.toUpperCase().replace(/'/g, "''");
      sql += ` AND SPECIFIC_SCHEMA = '${escapedSchema}'`;
    }
    sql += " ORDER BY SPECIFIC_SCHEMA, SPECIFIC_NAME, ORDINAL_POSITION";
    return sql;
  }
  quoteIdentifier(identifier) {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
  getRowString(row, keys) {
    if (!row) {
      return void 0;
    }
    for (const key of keys) {
      const direct = row[key];
      if (typeof direct === "string" && direct.trim() !== "") {
        return direct.trim();
      }
    }
    const lowerKeys = new Set(keys.map((k) => k.toLowerCase()));
    for (const [key, value] of Object.entries(row)) {
      if (!lowerKeys.has(key.toLowerCase())) {
        continue;
      }
      if (typeof value === "string" && value.trim() !== "") {
        return value.trim();
      }
      if (value !== void 0 && value !== null) {
        return String(value);
      }
    }
    return void 0;
  }
  getRowNumber(row, keys) {
    for (const key of keys) {
      const direct = row[key];
      if (typeof direct === "number" && Number.isFinite(direct)) {
        return direct;
      }
      if (typeof direct === "string" && direct.trim() !== "") {
        const parsed = Number(direct);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    const lowerKeys = new Set(keys.map((k) => k.toLowerCase()));
    for (const [key, value] of Object.entries(row)) {
      if (!lowerKeys.has(key.toLowerCase())) {
        continue;
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return void 0;
  }
  routineSpecificKey(schemaName, specificName) {
    return `${schemaName.toUpperCase()}::${specificName.toUpperCase()}`;
  }
  normalizeParameterMode(modeRaw) {
    const value = (modeRaw ?? "").trim().toUpperCase();
    if (value === "IN") return "in";
    if (value === "OUT") return "out";
    if (value === "INOUT") return "inout";
    if (value === "VARIADIC") return "variadic";
    if (value === "RETURN") return "return";
    return void 0;
  }
  buildRoutineSignature(routine) {
    const args = (routine.parameters ?? []).filter((parameter) => parameter.mode !== "return").map((parameter) => {
      const modePrefix = parameter.mode ? `${parameter.mode.toUpperCase()} ` : "";
      const typeSuffix = parameter.type ? ` ${parameter.type}` : "";
      return `${modePrefix}${parameter.name}${typeSuffix}`.trim();
    }).join(", ");
    return `${routine.name}(${args})`;
  }
  createConnection(profile, secrets) {
    const options = {
      account: this.normalizeAccountForSdk(profile.account),
      username: profile.username,
      warehouse: profile.warehouse,
      database: profile.database,
      schema: profile.schema,
      role: profile.role || void 0,
      clientSessionKeepAlive: true
    };
    if (profile.authMode === "keypair") {
      options.authenticator = "SNOWFLAKE_JWT";
      options.privateKeyPath = profile.privateKeyPath;
      if (secrets.privateKeyPassphrase) {
        options.privateKeyPass = String(secrets.privateKeyPassphrase);
      }
    } else {
      options.password = secrets.password;
    }
    return snowflake.createConnection(options);
  }
  normalizeAccountForSdk(account) {
    const raw = String(account ?? "").trim();
    if (!raw) {
      return raw;
    }
    const host = raw.replace(/^jdbc:snowflake:\/\//i, "").replace(/^https?:\/\//i, "").split(/[/?#]/)[0].replace(/\.$/, "");
    if (host.toLowerCase().endsWith(SNOWFLAKE_DOMAIN_SUFFIX)) {
      return host.slice(0, -SNOWFLAKE_DOMAIN_SUFFIX.length);
    }
    return host;
  }
  connect(conn) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timed out after ${CONNECTION_TIMEOUT_MS / 1e3} seconds`));
      }, CONNECTION_TIMEOUT_MS);
      conn.connect((err) => {
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve();
      });
    });
  }
  destroy(conn) {
    return new Promise((resolve) => {
      conn.destroy(() => resolve());
    });
  }
  execute(conn, sql) {
    return new Promise((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, _stmt, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      });
    });
  }
  executeWithStatement(conn, sql) {
    return new Promise((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve({ rows: rows || [], statement: stmt });
        }
      });
    });
  }
};

// src/snowflakeInstructions.ts
var vscode = __toESM(require("vscode"));
async function fileExists(uri) {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}
async function getRunQLSystemUri() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return void 0;
  }
  const root = folders[0].uri;
  const runqlSystem = vscode.Uri.joinPath(root, "RunQL", "system");
  try {
    const stat = await vscode.workspace.fs.stat(runqlSystem);
    if (stat.type !== vscode.FileType.Directory) {
      return void 0;
    }
  } catch {
    return void 0;
  }
  return runqlSystem;
}
async function ensureSnowflakeInstructions() {
  const runqlSystem = await getRunQLSystemUri();
  if (!runqlSystem) {
    return void 0;
  }
  const instructionsUri = vscode.Uri.joinPath(runqlSystem, "connection.snowflake.instructions.md");
  if (await fileExists(instructionsUri)) {
    return instructionsUri;
  }
  const content = `# Snowflake Connection Setup Instructions (RunQL)

This guide covers:
1. What info you need to create a connection to Snowflake.
2. Creating a private/public key pair.
3. Setting the public key on your Snowflake user.
4. Getting JDBC/ODBC or TOML connection details from Snowflake.
5. Mapping that data into RunQL.

## 1) What you need to connect to Snowflake

Snowflake details:
- \`account\`
- \`user\`
- \`warehouse\`
- \`database\`
- \`schema\`

and the path to your private key file (e.g. \`rsa_key.p8\`).

## 2) Generate a Snowflake key pair

Use OpenSSL to generate a PKCS8 private key and public key.

### Create your private and public key files

\`\`\`bash
# Private key (PKCS8, encrypted)
openssl genrsa 2048 | openssl pkcs8 -topk8 -v2 aes-256-cbc -inform PEM -out rsa_key.p8

# Public key
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
\`\`\`
Ensure you keep private key files secure and out of source control.

### Convert \`rsa_key.pub\` to one-line base64 value

\`\`\`bash
# macOS/Linux - use this base64 output for the next step
openssl rsa -in rsa_key.p8 -pubout -outform DER | base64 | tr -d '\\n'
\`\`\`
Copy the output value and paste it into the SQL command in Snowflake (see next step).

### Run Snowflake SQL

\`\`\`sql
ALTER USER <YOUR_SNOWFLAKE_USERNAME>
SET RSA_PUBLIC_KEY='<PASTE_PUBLIC_KEY_BASE64_HERE>';
\`\`\`

## 3) Get JDBC/ODBC connection details OR TOML connection config from Snowflake

In Snowflake, click on your user image (initials or your picture) in the bottom left corner. Hover over the Snowflake Account id, then click on "View account details".

1. Click the Connectors/Drivers tab.
2. Select ODBC or JDBC in the dropdown.
3. Select the warehouse and database in the dropdowns.
4. Click copy to clipboard.
5. Paste the string into the RunQL Snowflake "Import Connection Settings" field.
6. Click Parse and Fill.

Example JDBC:

\`\`\`text
jdbc:snowflake://ABCDEFG-XY12345.snowflakecomputing.com/?user=User1&warehouse=COMPUTE_WH&db=JAFFLE_SHOP&schema=PUBLIC&authenticator=externalbrowser
\`\`\`

You can optionally use the TOML connection config. Just ensure you select the warehouse and database in the dropdowns before clicking copy to clipboard.

## 5) Enter details in RunQL

1. Paste the JDBC/ODBC string OR TOML config file text into the RunQL Snowflake "Import Connection Settings" field.
2. Click Parse and Fill.
3. Click on the Auth tab.
4. Add your Snowflake username.
5. Browse to your private key location.
6. Add your passphrase for the private key.
7. Select your credential storage option (session, or encrypted on disk).
8. Click test connection.
9. Click save.
`;
  await vscode.workspace.fs.writeFile(instructionsUri, new TextEncoder().encode(content));
  return instructionsUri;
}
async function openSnowflakeInstructions() {
  const instructionsUri = await ensureSnowflakeInstructions();
  if (!instructionsUri) {
    vscode.window.showWarningMessage("Initialize your RunQL project first so RunQL/system exists, then open the Snowflake setup guide.");
    return;
  }
  const doc = await vscode.workspace.openTextDocument(instructionsUri);
  await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
}

// src/snowflakeImportParser.ts
var SUPPORTED_KEYS = /* @__PURE__ */ new Set(["account", "user", "username", "warehouse", "db", "database", "schema", "role"]);
function parseSnowflakeImport(input) {
  const trimmed = input.trim();
  if (trimmed.startsWith("jdbc:snowflake://") || trimmed.includes("snowflakecomputing.com")) {
    return parseJdbcString(trimmed);
  }
  if (trimmed.includes("[connections.") || trimmed.includes("account =") || trimmed.includes("account=")) {
    return parseTomlSnippet(trimmed);
  }
  if (trimmed.includes("=")) {
    return parseKeyValueString(trimmed);
  }
  return { fields: {}, ignoredKeys: [] };
}
function parseJdbcString(input) {
  const fields = {};
  const ignoredKeys = [];
  const hostMatch = input.match(/snowflake:\/\/([^.]+)\.snowflakecomputing\.com/i) || input.match(/snowflake:\/\/([^\/]+)/i);
  if (hostMatch) {
    let account = hostMatch[1];
    account = account.replace(/\.snowflakecomputing\.com.*$/i, "");
    fields.account = account;
  }
  const queryMatch = input.match(/\?(.+)$/);
  if (queryMatch) {
    const params = new URLSearchParams(queryMatch[1]);
    for (const [key, value] of params.entries()) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === "user" || lowerKey === "username") {
        fields.username = value;
      } else if (lowerKey === "warehouse") {
        fields.warehouse = value;
      } else if (lowerKey === "db" || lowerKey === "database") {
        fields.database = value;
      } else if (lowerKey === "schema") {
        fields.schema = value;
      } else if (lowerKey === "role") {
        fields.role = value;
      } else if (!SUPPORTED_KEYS.has(lowerKey)) {
        ignoredKeys.push(key);
      }
    }
  }
  return { fields, ignoredKeys };
}
function parseTomlSnippet(input) {
  const fields = {};
  const ignoredKeys = [];
  const lines = input.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("[") || trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }
    const match = trimmedLine.match(/^(\w+)\s*=\s*["']?([^"'\n]+)["']?\s*$/);
    if (match) {
      const [, key, value] = match;
      const lowerKey = key.toLowerCase();
      if (lowerKey === "account") {
        fields.account = value.trim();
      } else if (lowerKey === "user" || lowerKey === "username") {
        fields.username = value.trim();
      } else if (lowerKey === "warehouse") {
        fields.warehouse = value.trim();
      } else if (lowerKey === "db" || lowerKey === "database") {
        fields.database = value.trim();
      } else if (lowerKey === "schema") {
        fields.schema = value.trim();
      } else if (lowerKey === "role") {
        fields.role = value.trim();
      } else {
        ignoredKeys.push(key);
      }
    }
  }
  return { fields, ignoredKeys };
}
function parseKeyValueString(input) {
  const fields = {};
  const ignoredKeys = [];
  const pairs = input.split(/[;&\n]/);
  for (const pair of pairs) {
    const match = pair.trim().match(/^(\w+)\s*=\s*["']?([^"'\n;]+)["']?\s*$/);
    if (match) {
      const [, key, value] = match;
      const lowerKey = key.toLowerCase();
      if (lowerKey === "account") {
        fields.account = value.trim();
      } else if (lowerKey === "user" || lowerKey === "username") {
        fields.username = value.trim();
      } else if (lowerKey === "warehouse") {
        fields.warehouse = value.trim();
      } else if (lowerKey === "db" || lowerKey === "database") {
        fields.database = value.trim();
      } else if (lowerKey === "schema") {
        fields.schema = value.trim();
      } else if (lowerKey === "role") {
        fields.role = value.trim();
      } else {
        ignoredKeys.push(key);
      }
    }
  }
  return { fields, ignoredKeys };
}

// src/extension.ts
var AUTO_OPEN_KEY = "runql.snowflake.setupGuideAutoOpened.v1";
async function autoOpenSetupGuideOnFirstInstall(context) {
  const alreadyOpened = context.globalState.get(AUTO_OPEN_KEY, false);
  if (alreadyOpened) {
    return;
  }
  const uri = await ensureSnowflakeInstructions();
  if (!uri) {
    return;
  }
  try {
    const doc = await vscode2.workspace.openTextDocument(uri);
    await vscode2.window.showTextDocument(doc, { preview: true, viewColumn: vscode2.ViewColumn.Beside });
    await context.globalState.update(AUTO_OPEN_KEY, true);
  } catch {
  }
}
function handleProviderAction(actionId, payload) {
  if (actionId === "openInstructions") {
    void openSnowflakeInstructions();
    return {};
  }
  if (actionId === "parseImport") {
    const input = String(payload.snowflakeImportInput ?? "").trim();
    if (!input) {
      return {
        status: {
          type: "error",
          text: "Please paste a connection string to parse."
        }
      };
    }
    const result = parseSnowflakeImport(input);
    const fields = result.fields ?? {};
    const hasFields = Object.keys(fields).length > 0;
    let status;
    if (result.ignoredKeys.length > 0) {
      status = {
        type: "info",
        text: `Imported fields. Ignored unsupported keys: ${result.ignoredKeys.join(", ")}`
      };
    } else if (hasFields) {
      status = {
        type: "success",
        text: "Connection settings imported successfully."
      };
    } else {
      status = {
        type: "error",
        text: "Could not parse any connection fields from input."
      };
    }
    return {
      profilePatch: {
        ...fields.account ? { account: fields.account } : {},
        ...fields.username ? { username: fields.username } : {},
        ...fields.warehouse ? { warehouse: fields.warehouse } : {},
        ...fields.database ? { database: fields.database } : {},
        ...fields.schema ? { schema: fields.schema } : {},
        ...fields.role ? { role: fields.role } : {}
      },
      localPatch: {
        snowflakeImportInput: ""
      },
      status
    };
  }
  return {
    status: {
      type: "error",
      text: `Unknown Snowflake action: ${actionId}`
    }
  };
}
async function activate(context) {
  const core = vscode2.extensions.getExtension("runql.runql");
  if (!core) {
    vscode2.window.showWarningMessage("RunQL Snowflake Connector requires runql.runql.");
    return;
  }
  const api = await core.activate();
  if (!api || typeof api.registerProvider !== "function" || typeof api.registerAdapter !== "function" || typeof api.registerProviderActionHandler !== "function") {
    vscode2.window.showWarningMessage("RunQL core API is unavailable. Update RunQL and try again.");
    return;
  }
  context.subscriptions.push(
    api.registerProvider(snowflakeProvider),
    api.registerAdapter("snowflake", () => new SnowflakeAdapter()),
    api.registerProviderActionHandler("snowflake", handleProviderAction),
    vscode2.commands.registerCommand("runql.snowflake.openSetupGuide", async () => {
      await openSnowflakeInstructions();
    })
  );
  void ensureSnowflakeInstructions();
  void autoOpenSetupGuideOnFirstInstall(context);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
