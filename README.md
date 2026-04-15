# RunQL Snowflake Connector

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![VS Code](https://img.shields.io/badge/vscode-%5E1.96.0-007ACC)](https://code.visualstudio.com/)

Optional Snowflake connector for the [RunQL](https://marketplace.visualstudio.com/items?itemName=RunQL-VSCode-Extension.runql) VS Code extension. Install alongside RunQL to query Snowflake warehouses with SQL, introspect schemas, and generate ERDs.

This extension is maintained separately so that users who do not need Snowflake are not required to install the `snowflake-sdk` dependency.

## Installation

1. Install [RunQL](https://marketplace.visualstudio.com/items?itemName=RunQL-VSCode-Extension.runql) (required — declared as an extension dependency).
2. Install **RunQL Snowflake Connector** from the VS Code Marketplace.

On first install the extension opens a setup guide with instructions for generating a key pair and configuring your Snowflake user.

## Usage

1. Open the RunQL explorer view.
2. Click **Add Connection** and choose **Snowflake**.
3. Fill in **Account**, **Warehouse**, **Database**, **Schema** (optional), **Role** (optional).
4. On the **Auth** tab:
   - Set **Authentication Mode** to **Key-Pair Authentication**.
   - Select your private key file (`.p8` / `.pem` / `.key`).
   - If the key is encrypted, enter the passphrase.
5. Save and test the connection.

### Auto-fill from an existing connection string

The connection form includes a **Parse & Fill** action that accepts:
- JDBC URLs (`jdbc:snowflake://ACCOUNT.snowflakecomputing.com/?user=...`)
- ODBC-style connection strings
- Snowflake TOML `[connections.*]` blocks

It extracts `account`, `username`, `warehouse`, `database`, `schema`, and `role` and populates the form.

## Requirements

- VS Code `^1.96.0`
- [RunQL](https://marketplace.visualstudio.com/items?itemName=RunQL-VSCode-Extension.runql) extension
- A Snowflake account with key-pair authentication configured

## Authentication

Only **key-pair authentication** is supported today (per Snowflake's deprecation of single-factor password auth). The connector uses Snowflake's JWT authenticator under the hood; no secrets leave your machine aside from the key-pair JWT exchange with Snowflake.

## How it works

On activation, this extension acquires the RunQL extension API and calls:

- `registerProvider(snowflakeProvider)` — adds a Snowflake entry to the connection form.
- `registerAdapter('snowflake', () => new SnowflakeAdapter())` — wires the dialect to its implementation.
- `registerProviderActionHandler('snowflake', ...)` — handles the **Parse & Fill** and **Open Instructions** buttons.

The adapter wraps the [`snowflake-sdk`](https://www.npmjs.com/package/snowflake-sdk) Node package (pure JavaScript — no native binaries), so this extension ships as a single universal VSIX that installs on all platforms.

## Commands

- **RunQL: Snowflake Setup Guide** — opens the key-pair setup instructions in an editor tab.

## Building from source

```bash
git clone https://github.com/DVCodeLabs/RunQL-Snowflake.git
cd RunQL-Snowflake
npm install
npm run package   # produces dist/extension.js
```

To produce a local VSIX for testing:

```bash
npm install -g @vscode/vsce
vsce package
```

## Contributing

Issues and pull requests welcome at [DVCodeLabs/RunQL-Snowflake](https://github.com/DVCodeLabs/RunQL-Snowflake). Please follow the code of conduct shared with the RunQL project.

## License

MIT — see [LICENSE](./LICENSE).
