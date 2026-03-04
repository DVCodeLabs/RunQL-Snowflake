/**
 * Snowflake Connection Import Parser
 * Parses JDBC/ODBC strings and TOML snippets to extract connection fields.
 */

export interface SnowflakeImportResult {
  fields: {
    account?: string;
    username?: string;
    warehouse?: string;
    database?: string;
    schema?: string;
    role?: string;
  };
  ignoredKeys: string[];
}

const SUPPORTED_KEYS = new Set(['account', 'user', 'username', 'warehouse', 'db', 'database', 'schema', 'role']);

/**
 * Parse a Snowflake connection string (JDBC/ODBC or TOML format)
 */
export function parseSnowflakeImport(input: string): SnowflakeImportResult {
  const trimmed = input.trim();

  if (trimmed.startsWith('jdbc:snowflake://') || trimmed.includes('snowflakecomputing.com')) {
    return parseJdbcString(trimmed);
  }
  if (trimmed.includes('[connections.') || trimmed.includes('account =') || trimmed.includes('account=')) {
    return parseTomlSnippet(trimmed);
  }

  if (trimmed.includes('=')) {
    return parseKeyValueString(trimmed);
  }

  return { fields: {}, ignoredKeys: [] };
}

function parseJdbcString(input: string): SnowflakeImportResult {
  const fields: SnowflakeImportResult['fields'] = {};
  const ignoredKeys: string[] = [];

  const hostMatch = input.match(/snowflake:\/\/([^.]+)\.snowflakecomputing\.com/i)
    || input.match(/snowflake:\/\/([^\/]+)/i);
  if (hostMatch) {
    let account = hostMatch[1];
    account = account.replace(/\.snowflakecomputing\.com.*$/i, '');
    fields.account = account;
  }

  const queryMatch = input.match(/\?(.+)$/);
  if (queryMatch) {
    const params = new URLSearchParams(queryMatch[1]);

    for (const [key, value] of params.entries()) {
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'user' || lowerKey === 'username') {
        fields.username = value;
      } else if (lowerKey === 'warehouse') {
        fields.warehouse = value;
      } else if (lowerKey === 'db' || lowerKey === 'database') {
        fields.database = value;
      } else if (lowerKey === 'schema') {
        fields.schema = value;
      } else if (lowerKey === 'role') {
        fields.role = value;
      } else if (!SUPPORTED_KEYS.has(lowerKey)) {
        ignoredKeys.push(key);
      }
    }
  }

  return { fields, ignoredKeys };
}

function parseTomlSnippet(input: string): SnowflakeImportResult {
  const fields: SnowflakeImportResult['fields'] = {};
  const ignoredKeys: string[] = [];

  const lines = input.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('[') || trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue;
    }

    const match = trimmedLine.match(/^(\w+)\s*=\s*["']?([^"'\n]+)["']?\s*$/);
    if (match) {
      const [, key, value] = match;
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'account') {
        fields.account = value.trim();
      } else if (lowerKey === 'user' || lowerKey === 'username') {
        fields.username = value.trim();
      } else if (lowerKey === 'warehouse') {
        fields.warehouse = value.trim();
      } else if (lowerKey === 'db' || lowerKey === 'database') {
        fields.database = value.trim();
      } else if (lowerKey === 'schema') {
        fields.schema = value.trim();
      } else if (lowerKey === 'role') {
        fields.role = value.trim();
      } else {
        ignoredKeys.push(key);
      }
    }
  }

  return { fields, ignoredKeys };
}

function parseKeyValueString(input: string): SnowflakeImportResult {
  const fields: SnowflakeImportResult['fields'] = {};
  const ignoredKeys: string[] = [];

  const pairs = input.split(/[;&\n]/);

  for (const pair of pairs) {
    const match = pair.trim().match(/^(\w+)\s*=\s*["']?([^"'\n;]+)["']?\s*$/);
    if (match) {
      const [, key, value] = match;
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'account') {
        fields.account = value.trim();
      } else if (lowerKey === 'user' || lowerKey === 'username') {
        fields.username = value.trim();
      } else if (lowerKey === 'warehouse') {
        fields.warehouse = value.trim();
      } else if (lowerKey === 'db' || lowerKey === 'database') {
        fields.database = value.trim();
      } else if (lowerKey === 'schema') {
        fields.schema = value.trim();
      } else if (lowerKey === 'role') {
        fields.role = value.trim();
      } else {
        ignoredKeys.push(key);
      }
    }
  }

  return { fields, ignoredKeys };
}
