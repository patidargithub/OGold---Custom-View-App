# Zendesk Custom Ticket Search Navbar App

A production-ready Zendesk Navbar App built with the **Zendesk ZCLI React Scaffold**, **Zendesk Apps Framework (ZAF Client)**, and **Zendesk Garden React Components**.

This application allows agents to build complex, multi-value ticket searches using both standard and custom Zendesk fields, retrieve matching results with side-loaded resource resolution, and view them in a fully interactive, paginated, and sortable table mimicking the native Zendesk Views.

---

## Features

- **App Location**: Built specifically for the **Global Navigation Bar** (`nav_bar`) with a custom launcher SVG icon.
- **Dynamic Field Metadata**: Fetches standard and custom ticket fields dynamically from the Zendesk REST API on startup.
- **Dynamic Filter Builder**:
  - Supports standard fields (Status, Priority, Type, Group, Tags, Dates) and all active Custom Fields.
  - Generates appropriate inputs based on field type (multi-select options for dropdowns, checkbox picker, calendar for dates, and custom tag-style entry fields).
  - Supports **multiple values** for a single field condition (e.g. Status = Open OR Pending).
  - Translates filter structures using proper Zendesk search syntax logic (`OR` within same-field values, `AND` across different fields).
- **Custom Column Selector**: Interactive dual-list searchable builder allows users to pick which fields appear in the table and rearrange their display order.
- **Robust API Service Layer**:
  - trap HTTP 429 status codes and handle Rate Limits using an exponential backoff retry loop.
  - Sideloads related `users`, `groups`, and `organizations` on each search query, caching profiles to show human-readable names (e.g., assignees and requesters) rather than ID integers.
- **Zendesk Views Interactive Table**:
  - Sticky table headers with ascending/descending column sorting indicator.
  - Global query filtering on loaded records.
  - Loading skeleton indicators, empty result panels, and warning/error alerts.
  - Responsive layout matching Zendesk Garden design patterns.
  - Click-to-open handlers routing natively inside Zendesk (`client.invoke('routeTo')`).

---

## Folder Structure

```text
├── README.md               # App documentation, setup, and troubleshooting instructions
├── package.json            # Project dependencies and script runner configurations
├── vite.config.js          # Bundling configs, static asset copy, and marketplace rules
├── dist/                   # Production build directory (packaged for marketplace)
└── src/
    ├── assets/             # Manifest assets, logos, and icon_nav_bar.svg
    ├── manifest.json       # App registration definition (location, permissions)
    └── app/
        ├── App.jsx         # Handles location routing (nav_bar, modal, etc.)
        ├── index.jsx       # App bootstrap wrapper (provides ClientProvider)
        ├── index.css       # Layout CSS system resets
        ├── components/     # High-fidelity visual React components
        │   ├── Icons.jsx         # Custom self-contained SVG icon pack
        │   ├── FilterBuilder.jsx # Filters builder with TagInput
        │   ├── ColumnPicker.jsx  # Column selector dual-list searcher
        │   ├── TicketTable.jsx   # Paginated, sortable Zendesk views table
        │   ├── SettingsTab.jsx   # Panel groupings for search settings
        │   └── TicketsTab.jsx    # Results view panel with filter box
        ├── contexts/       # React Context Providers (client context, translations)
        ├── hooks/          # useClient hooks
        ├── locations/      # Entry screens per app location
        │   └── NavBarApp.jsx     # Main workspace coordinate
        └── services/       # External APIs and connection adapters
            └── zendeskApi.js     # Query string builder, 429 traps, caches, search APIs
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: Version `20.17.0` or later.
- **NPM** or **PNPM** package manager.
- **ZCLI**: Zendesk Command Line Interface. Install globally via npm:
  ```bash
  npm install @zendesk/zcli -g
  ```

### Local Setup
1. Clone the project directory and open your terminal.
2. Install dependencies:
   ```bash
   npm install
   ```

---

## Development & Local Testing

### 1. Start the Vite Dev Server
Compiles code and runs local asset updates automatically via Hot Module Replacement (HMR):
```bash
npm run dev
```
The asset server will run locally at `http://localhost:3000/`.

### 2. Start ZCLI App Server
In a separate terminal window, launch ZCLI to serve the manifest:
```bash
npm run start
```
*Note: This executes `zcli apps:server src` under the hood.*

### 3. Load App in Zendesk Support
1. Log in to your Zendesk Support domain (e.g., `https://mycompany.zendesk.com/agent`).
2. Add the query parameter `?zcli_apps=true` to the URL:
   `https://mycompany.zendesk.com/agent/dashboard?zcli_apps=true`
3. Click the launcher icon in the global left sidebar to load and run your local React app in Zendesk!

---

## ZCLI Commands & Build Scripts

- **`npm run dev`**: Starts local Vite server (HMR on port 3000).
- **`npm run start`**: Runs the ZCLI local app server pointing to `src`.
- **`npm run build`**: Compiles source code into production assets under `dist/`.
- **`npm run lint`**: Performs ESLint static code quality audits.
- **`zcli apps:validate dist`**: Verifies if the production folder conforms to Zendesk App guidelines.
- **`zcli apps:package dist`**: Packages the app into a `.zip` archive ready to upload to the Zendesk Apps Marketplace.

---

## Deployment & Packaging

To compile, validate, and bundle the app for deployment:

1. **Build assets**:
   ```bash
   npm run build
   ```
2. **Validate**:
   ```bash
   zcli apps:validate dist
   ```
3. **Package zip archive**:
   ```bash
   zcli apps:package dist
   ```
This generates a zip file (e.g. `app.zip`) in the project directory, which can be uploaded to the Zendesk Admin Center under **Apps and Integrations > Support Apps > Upload Private App**.

---

## Troubleshooting

#### ⚠️ Webpack/Vite dev server is running, but ZCLI doesn't find assets:
Make sure the ports match. By default, `vite.config.js` is set to port `3000` and `manifest.json` points local URLs to `http://localhost:3000/`. Ensure no other processes are utilizing port 3000.

#### ⚠️ The launcher icon is not displaying on the sidebar:
Navbar apps require a specific icon format and path. Ensure `icon_nav_bar.svg` exists under `src/assets/` and is copied during the build (the static copy configuration does this automatically).

#### ⚠️ Rate limit errors (429) occur:
The API service automatically captures HTTP 429 responses and retries after the specified `Retry-After` header window expires, with a backoff multiplier. Check the browser console logs to see active retry attempts.
