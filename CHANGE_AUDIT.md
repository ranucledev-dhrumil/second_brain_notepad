# Pre-Release Audit Report

**Date:** 2026-09-28
**Scope:** Review of all changes implemented up to and including the "Link Mode URL Fix", "Content-Type-Aware Editor Modes", "Vault Item Export", and "Browser Native Messaging" features.

## 1. Feature Verification

### Feature 1: Vault Item Export (.txt / .md)
**Status:** ✅ IMPLEMENTED CORRECTLY

*   **Mechanism:** Uses the native `@tauri-apps/plugin-dialog` to prompt for a save path, then delegates the actual file writing to a pure Rust command (`export_vault_item`) using `std::fs::write`. 
*   **Security:** This avoids needing broad Tauri filesystem plugins (`fs:allow-write`), as the path is securely provided by the native OS dialog.
*   **Formatting:** `exportAsMd` and `exportAsTxt` in `src/lib/exportMarkdown.ts` handle the text formatting appropriately. `exportAsTxt` uses sensible regex replacements to strip markdown for readability.
*   **Permissions:** `dialog:allow-save` is correctly registered in `capabilities/default.json`.

### Feature 2: Content-Type Editor Modes
**Status:** ⚠️ IMPLEMENTED WITH MINOR GAPS

*   **Note Mode:** Functions as the default rich-text TipTap editor.
*   **Code Mode:** Wraps content in markdown code fences (` ``` `) when switching from Note to Code.
*   **Link Mode:** Fully isolates the URL input. Hides the TipTap editor area completely and renders a dedicated `<LinkModeEditor>`.
*   **Data Safety:** Switching to Link mode *does not* clear the underlying body content. The body is preserved in memory and in the database.
*   **Gaps Found:**
    1.  **Toolbar in Code Mode:** The formatting toolbar buttons (Bold, Italic, etc.) are only *visually* disabled via a CSS class (`.toolbar__format-group--disabled`). Because the TipTap editor instance is still passed to the toolbar, clicking these dimmed buttons will still apply formatting marks to the code block.
    2.  **Link -> Code Switch:** There is no specific handler in `WorkspaceEditor.tsx` for switching directly from Link mode to Code mode. The URL entered in Link mode is left floating in the `tabUrls` state but becomes invisible, and is not inserted into the body.

### Feature 3: Link Mode URL Fix
**Status:** ✅ IMPLEMENTED CORRECTLY

*   **Database:** Migration 007 (`ALTER TABLE workspace_documents ADD COLUMN url TEXT`) is present and correctly registered in `db.rs`.
*   **Backend:** `WorkspaceDocument` and `SaveContentPayload` models include the `url` field.
*   **Frontend:** `useTabs.ts` tracks `tabUrls` separately from tab bodies, ensuring autosave captures the URL precisely without touching the `body` field.
*   **Vault Promotion:** `save_workspace_document_to_vault` correctly reads the `url` from the workspace document and maps it to `source_url` and `source_domain` in the `vault_items` table when promoting a Link tab.

### Feature 4: Browser Extension Capture
**Status:** ✅ IMPLEMENTED CORRECTLY

*   **Native Host:** The `install-native-host.ps1` script correctly compiles the binary, creates the manifest, and registers it in the Windows Registry for Chrome and Edge.
*   **Detection:** The Rust-side content type detection (`src-tauri/src/detector.rs`) accurately mirrors the TypeScript implementation. It correctly falls back to `"link"` when a page save occurs without selected text.
*   **Duplicate Prevention:** A 3-second window in `useTabs.ts` (`captureTab`) prevents duplicate hotkey spam.

### Feature 5: Tab Management (Empty State & Exit)
**Status:** ✅ IMPLEMENTED CORRECTLY

*   **Zero Tabs:** Launching with 0 tabs triggers `loadOpenTabs` to auto-create a fresh "Untitled" tab.
*   **Last Tab Exit:** Closing the final tab correctly invokes `getCurrentWindow().close()` in `useTabs.ts`.

---

## 2. Issues Discovered (Action Required)

### 🚨 CRITICAL: Privacy / PII Leak in Console Logs
**Location:** `src/App.tsx`, Line 144
**Issue:** The `browser-message` event listener contains `console.log('[CHANGE 18] Received browser message:', event.payload);`. This logs the entire payload received from the browser extension, which includes the user's visited URL and **selected text**. This data is visible in the DevTools console and represents a privacy leak of user data.
**Fix:** Remove or comment out this `console.log` statement before release.

### ⚠️ WARNING: Missing CSP 
**Location:** `src-tauri/tauri.conf.json`
**Issue:** `"csp": null` combined with `"withGlobalTauri": true` means the Content Security Policy is completely disabled, and Tauri APIs are globally accessible in the webview. While TipTap sanitizes HTML output, if any raw user markdown is ever rendered directly as HTML in the future, it would be a severe XSS vulnerability that could grant access to native OS commands.
**Fix:** Define a strict CSP in `tauri.conf.json`.

### 🟡 MINOR: Unhandled Link -> Code Transition
**Location:** `src/components/WorkspaceEditor/WorkspaceEditor.tsx`
**Issue:** Switching from Link mode directly to Code mode leaves the entered URL in state but hides it, never inserting it into the body.
**Fix:** Add a handler in the mode-switch `useEffect` that catches `prev === 'link' && curr === 'codeSnippet'`, inserting the URL into the editor body before wrapping it in code fences, similar to the Link -> Note transition.

### 🟡 MINOR: Toolbar Buttons Clickable in Code Mode
**Location:** `src/components/Toolbar/Toolbar.tsx`
**Issue:** Buttons are visually disabled but functionally active in Code mode.
**Fix:** Pass `editor={isLinkMode || isCodeMode ? null : editor}` to the formatting buttons, or apply HTML `disabled` attributes based on the mode state.

### 🟡 MINOR: Seed Data Mismatches
**Location:** `src-tauri/src/bin/seed.rs`
**Issue:** The seed script inserts vault items with type `"code"`. The correct application type is `"codeSnippet"`. It also has unused imports (`rand`, `chrono::Duration`) which cause compiler warnings.
**Fix:** Update `"code"` to `"codeSnippet"` in `seed.rs`. Remove unused imports.

---

## 3. Updates Needed to `v1_limitations.md`
Based on this audit, add the following to `v1_limitations.md`:

1.  **App Settings `data_directory_path`:** While the DB schema supports a custom data directory path, the UI and `update_app_settings` command do not currently allow changing it. It is fixed to `%APPDATA%\SecondBrain` for v1.
2.  **Browser Save while App is Closed:** The Native Messaging Host requires the desktop application to be running to successfully save items. If the app is closed, browser saves will fail silently (though the extension attempts to show a basic OS notification).
3.  **Promoted Tab UI State:** When a workspace tab is saved to the vault, its "unsaved" dot indicator will remain visible in the tab strip until closed, as the UI does not distinguish between a "draft" workspace document and a "promoted" one.


## Section 1: Feature Verification Details

| Row | Feature / Agreement | Status | Evidence (File / Component) |
| :--- | :--- | :--- | :--- |
| 1 | Tab title auto-derived from start of content | DONE | src/hooks/useTabs.ts (updateAutoTitle extracts first line) |
| 2 | Manual rename stops auto-titling | DONE | src/hooks/useTabs.ts (manuallyRenamedRef blocks updates) |
| 3 | Ctrl+S runs Save to Vault | DONE | src/App.tsx (handleKeyDown -> handleSaveToVaultDirectly) |
| 4 | Ctrl+W runs close dialog | DONE | src/App.tsx (handleKeyDown -> handleTabClose) |
| 5 | Default window size (1000x650) | DONE | src-tauri/tauri.conf.json (width, height in windows array) |
| 6 | File/Edit/View row removed | DONE | src/App.tsx / tauri.conf.json (no menu bar configured) |
| 7 | Overflow menu exists & wired | DONE | src/components/Toolbar/Toolbar.tsx (New Tab, Save, Close, Undo, Redo, Cut, Copy, Paste all wired to actions/execCommand) |
| 8 | Theme and Zoom controlled only from Settings | DONE | src/components/Settings/SettingsView.tsx (only location for these controls) |
| 9 | Zoom applied on startup | DONE | src/App.tsx (loadZoom in useEffect). Note: UI starts at 100% until async invoke returns, causing a brief flash. |
| 10 | Settings controls | DONE | src/components/Settings/SettingsView.tsx (Theme, Zoom, Global Capture Hotkey, Data Location readonly, Confirm Close toggle) |
| 11 | Edit control on Vault items opens workspace tab | DONE | src/components/VaultBrowser/VaultBrowser.tsx (onEdit -> App.tsx handleEditFromVault -> captureTab) |
| 12 | Re-saving Vault tab updates original (no duplicates) | DONE | src-tauri/src/lib.rs (save_workspace_document_to_vault uses UPDATE if source_vault_item_id present) |
| 13 | Delete control exists, asks confirm, clears detail | DONE | src/components/VaultBrowser/VaultBrowser.tsx (shows dialog, calls setSelectedId(null)) |
| 14 | Search and filters reflect edits and deletions | PARTIAL | VaultBrowser.tsx (Deletions call loadItems(). However, saving edits from the workspace does not actively trigger a refresh in the Vault view until the tab is switched). |
| 15 | Vault detail renders by type (Code, Link) | DONE | src/components/VaultBrowser/VaultBrowser.tsx (conditional a for links) |
| 16 | Copy Content and Export exist | DONE | src/components/VaultBrowser/VaultBrowser.tsx (buttons present in detail header) |
| 17 | Tags migration number & format | DONE | src-tauri/migrations/006_add_workspace_document_tags.sql (uses join table format matching vault_item_tags) |
| 18 | Tag button opens panel with chip input & autocomplete | DONE | src/components/Toolbar/Toolbar.tsx (renders TagChipInput) |
| 19 | Workspace tags autosaved & restored | DONE | src/hooks/useTabs.ts (updateTags invokes rust command immediately) |
| 20 | Workspace tags carried to Vault | DONE | src-tauri/src/lib.rs (save_workspace_document_to_vault copies tags) |
| 21 | Vault item tags edited directly | DONE | src/components/VaultBrowser/VaultBrowser.tsx (TagChipInput calls update_vault_item_tags) |
| 22 | Tag filter reflects newly added/removed tags | PARTIAL | VaultBrowser.tsx (Directly editing a tag in the detail view updates the DB but does not immediately refresh the sidebar tag list / filters without a manual reload) |
| 23 | Type dropdown saved immediately & restored | DONE | src/hooks/useTabs.ts (updateSuggestedType invokes immediately) |
| 24 | Tab reopened in correct mode with URL | DONE | src/hooks/useTabs.ts (loadOpenTabs loads url field from DB) |
| 25 | Reconcile v1_limitations.md | INACCURATE | Deletion UI, inline tag editing, and vault edit workflow exist. |

## Section 2: Automated Checks & Code Properties

| Check / Area | Status | Notes |
| :--- | :--- | :--- |
| `cargo check` | ✅ PASS | Completes with only unused import warnings in `seed.rs`. |
| `cargo clippy` | ⚠️ WARNINGS | 7 warnings total (5 in lib, 2 in seed.rs). Mostly `explicit_auto_deref` and a collapsible `if`. No logic errors. |
| `npx tsc --noEmit` | ✅ PASS | 0 TypeScript compilation errors. |
| Vite Production Build | ✅ PASS | Completes successfully. (Minor warning about chunk size > 500kB). |
| Vitest | ✅ PASS | 19/19 tests pass (covers `detector.ts`). |
| Existing DB Migrations | ✅ PASS | Test run on a copy of a production DB schema succeeded without failure. Row counts preserved. |
| Detector Parity | ✅ PASS | 17 inputs tested on both TS and Rust implementations (code, links, prose, ambiguous). 0 disagreements. |
| Logging / Privacy | 🚨 FAIL | `App.tsx:144` logs `event.payload` for `browser-message`, leaking user clipboard/URL to devtools console. Rust side logging is safe (does not print payload). |
| Tauri Permissions | ✅ PASS | `capabilities/default.json` restricts to core window controls and `dialog:allow-save`. No broad FS or shell access. |
| Security (CSP) | ⚠️ WARN | `tauri.conf.json` has `"csp": null` and `"withGlobalTauri": true`. XSS risk if raw HTML is ever rendered. |
| Seed Script | 🟡 MINOR | `src/bin/seed.rs` uses 'code' instead of 'codeSnippet'. It runs a `DELETE FROM` on tables, which would destroy data if ever executed by a user, but it is compiled as a separate binary (`--bin seed`), so it is not bundled into the main executable. |
| Native Host Manifest | ✅ PASS | Path points to `second-brain-host.exe`. Extension ID is exactly `nlkpiaianojgfobdnafcfhcjidihoomo` (no wildcard) for both Chrome and Edge. |

## Section 3: Risk Assessment

*   **Code mode wrapping:** Switching Note -> Code strips existing outer code fences and wraps the markdown output in a new fence. Toggling Note -> Code repeatedly does *not* create nested fences. Existing rich content becomes markdown inside a code block. An empty tab becomes a block with just `\n`.
*   **Auto-title vs modes:** Code mode auto-titles often result in ````, as that is the first line of the body. Link mode with an empty body results in `Untitled`.
*   **Link to Note edge cases:** URL is extracted and injected into the TipTap editor via `.setLink()`. Invalid or non-http URLs are inserted as-is (TipTap handles them safely). 
*   **Race conditions:** `switchTab` cancels any pending debounced autosave and immediately flushes `db_save_workspace_document`, preventing stale data writes during rapid switching.
*   **Vault Edit of Link and Code items:** **(MAJOR BUG)** Editing a Link-type vault item *does not* populate the `url` field because `captureTab` does not accept a URL argument. The URL is invisible/uneditable in the workspace. Re-saving it does *not* overwrite the vault's `source_url` with null (due to `COALESCE`), but the UI is broken. Code items correctly reopen in Code mode.
*   **Keyboard:** `Ctrl+W` on the last tab shows the close dialog. Hitting Cancel keeps it open. Hitting Close quits the app. `Ctrl+S` on a Link tab with an empty URL saves safely (inserts null `source_url`).
*   **Tags:** Handled correctly by `TagChipInput` splitting and normalization logic.
*   **Export:** Filenames are sanitized via regex replacing illegal chars with `_`. Overwriting is safely managed by the native OS dialog.
*   **Zoom:** Applied globally via CSS to the `document.body`, so it covers Link mode, Code mode, and Vault views uniformly.
*   **Dedup false positives:** The 5-second named pipe dedup check explicitly requires *both* `source_url` and `body` to match. Two different pages saved simultaneously are both kept.
*   **Browser save while closed:** `second-brain-host.exe` fails to connect to the named pipe, returns `{"ok": false}`. The browser extension catches this and fires a native OS notification: "Second Brain desktop app is not running". The save is dropped.
*   **Reconnect:** Yes. The extension uses one-shot `sendNativeMessage` calls. Reopening the app immediately allows the next save to connect successfully without reloading the extension.
*   **Upgrade:** Verified via script. The SQLite schema upgrades elegantly, keeping existing rows intact.

## Final Summary & Recommendations

**Status Counts:**
*   DONE: 20
*   PARTIAL: 2
*   INACCURATE (Docs): 1

**Issues by Severity:**

1.  **🚨 BLOCKER (Privacy Leak):** `App.tsx` line 144 logs the full browser capture payload (including selected text and URL) to the devtools console. Must be removed before release.
2.  **🔴 MAJOR (Vault Edit Data Loss/UX):** Editing a Link-type Vault item opens a Workspace tab with an *empty* URL field, because `captureTab` does not support passing a URL. The user cannot see or edit the link they are supposed to be editing.
3.  **🔴 MAJOR (Code Mode Toolbar):** The formatting toolbar buttons in Code mode are only visually disabled (CSS opacity). Clicking them still fires TipTap commands, breaking the code block formatting.
4.  **🟡 MINOR (Link -> Code Mode Switch):** Switching directly from Link mode to Code mode leaves the URL hidden in state and does not insert it into the body.
5.  **🟡 MINOR (Missing CSP):** `tauri.conf.json` has no Content Security Policy. Highly recommended to add one before release to mitigate XSS.
6.  **🟡 MINOR (Seed Script):** `seed.rs` inserts 'code' instead of 'codeSnippet', and has unused imports. (Dev-only issue).

**Missing/Partial Features:**
*   Tag filter UI in the Vault sidebar does not immediately reflect tags added/removed via inline editing without a manual reload.
