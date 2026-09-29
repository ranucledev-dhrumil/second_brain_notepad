# Pre-Release Audit Report

**Date:** 2026-09-28
**Scope:** Review of all changes implemented up to and including the "Link Mode URL Fix", "Content-Type-Aware Editor Modes", "Vault Item Export", and "Browser Native Messaging" features.

## 1. Feature Verification

### Feature 1: Vault Item Export (.txt / .md)
**Status:** âœ… IMPLEMENTED CORRECTLY

*   **Mechanism:** Uses the native `@tauri-apps/plugin-dialog` to prompt for a save path, then delegates the actual file writing to a pure Rust command (`export_vault_item`) using `std::fs::write`. 
*   **Security:** This avoids needing broad Tauri filesystem plugins (`fs:allow-write`), as the path is securely provided by the native OS dialog.
*   **Formatting:** `exportAsMd` and `exportAsTxt` in `src/lib/exportMarkdown.ts` handle the text formatting appropriately. `exportAsTxt` uses sensible regex replacements to strip markdown for readability.
*   **Permissions:** `dialog:allow-save` is correctly registered in `capabilities/default.json`.

### Feature 2: Content-Type Editor Modes
**Status:** âš ï¸ IMPLEMENTED WITH MINOR GAPS

*   **Note Mode:** Functions as the default rich-text TipTap editor.
*   **Code Mode:** Wraps content in markdown code fences (` ``` `) when switching from Note to Code.
*   **Link Mode:** Fully isolates the URL input. Hides the TipTap editor area completely and renders a dedicated `<LinkModeEditor>`.
*   **Data Safety:** Switching to Link mode *does not* clear the underlying body content. The body is preserved in memory and in the database.
*   **Gaps Found:**
    1.  **Toolbar in Code Mode:** The formatting toolbar buttons (Bold, Italic, etc.) are only *visually* disabled via a CSS class (`.toolbar__format-group--disabled`). Because the TipTap editor instance is still passed to the toolbar, clicking these dimmed buttons will still apply formatting marks to the code block.
    2.  **Link -> Code Switch:** There is no specific handler in `WorkspaceEditor.tsx` for switching directly from Link mode to Code mode. The URL entered in Link mode is left floating in the `tabUrls` state but becomes invisible, and is not inserted into the body.

### Feature 3: Link Mode URL Fix
**Status:** âœ… IMPLEMENTED CORRECTLY

*   **Database:** Migration 007 (`ALTER TABLE workspace_documents ADD COLUMN url TEXT`) is present and correctly registered in `db.rs`.
*   **Backend:** `WorkspaceDocument` and `SaveContentPayload` models include the `url` field.
*   **Frontend:** `useTabs.ts` tracks `tabUrls` separately from tab bodies, ensuring autosave captures the URL precisely without touching the `body` field.
*   **Vault Promotion:** `save_workspace_document_to_vault` correctly reads the `url` from the workspace document and maps it to `source_url` and `source_domain` in the `vault_items` table when promoting a Link tab.

### Feature 4: Browser Extension Capture
**Status:** âœ… IMPLEMENTED CORRECTLY

*   **Native Host:** The `install-native-host.ps1` script correctly compiles the binary, creates the manifest, and registers it in the Windows Registry for Chrome and Edge.
*   **Detection:** The Rust-side content type detection (`src-tauri/src/detector.rs`) accurately mirrors the TypeScript implementation. It correctly falls back to `"link"` when a page save occurs without selected text.
*   **Duplicate Prevention:** A 3-second window in `useTabs.ts` (`captureTab`) prevents duplicate hotkey spam.

### Feature 5: Tab Management (Empty State & Exit)
**Status:** âœ… IMPLEMENTED CORRECTLY

*   **Zero Tabs:** Launching with 0 tabs triggers `loadOpenTabs` to auto-create a fresh "Untitled" tab.
*   **Last Tab Exit:** Closing the final tab correctly invokes `getCurrentWindow().close()` in `useTabs.ts`.

---

## 2. Issues Discovered (Action Required)

### ðŸš¨ CRITICAL: Privacy / PII Leak in Console Logs
**Location:** `src/App.tsx`, Line 144
**Issue:** The `browser-message` event listener contains `console.log('[CHANGE 18] Received browser message:', event.payload);`. This logs the entire payload received from the browser extension, which includes the user's visited URL and **selected text**. This data is visible in the DevTools console and represents a privacy leak of user data.
**Fix:** Remove or comment out this `console.log` statement before release.

### âš ï¸ WARNING: Missing CSP 
**Location:** `src-tauri/tauri.conf.json`
**Issue:** `"csp": null` combined with `"withGlobalTauri": true` means the Content Security Policy is completely disabled, and Tauri APIs are globally accessible in the webview. While TipTap sanitizes HTML output, if any raw user markdown is ever rendered directly as HTML in the future, it would be a severe XSS vulnerability that could grant access to native OS commands.
**Fix:** Define a strict CSP in `tauri.conf.json`.

### ðŸŸ¡ MINOR: Unhandled Link -> Code Transition
**Location:** `src/components/WorkspaceEditor/WorkspaceEditor.tsx`
**Issue:** Switching from Link mode directly to Code mode leaves the entered URL in state but hides it, never inserting it into the body.
**Fix:** Add a handler in the mode-switch `useEffect` that catches `prev === 'link' && curr === 'codeSnippet'`, inserting the URL into the editor body before wrapping it in code fences, similar to the Link -> Note transition.

### ðŸŸ¡ MINOR: Toolbar Buttons Clickable in Code Mode
**Location:** `src/components/Toolbar/Toolbar.tsx`
**Issue:** Buttons are visually disabled but functionally active in Code mode.
**Fix:** Pass `editor={isLinkMode || isCodeMode ? null : editor}` to the formatting buttons, or apply HTML `disabled` attributes based on the mode state.

### ðŸŸ¡ MINOR: Seed Data Mismatches
**Location:** `src-tauri/src/bin/seed.rs`
**Issue:** The seed script inserts vault items with type `"code"`. The correct application type is `"codeSnippet"`. It also has unused imports (`rand`, `chrono::Duration`) which cause compiler warnings.
**Fix:** Update `"code"` to `"codeSnippet"` in `seed.rs`. Remove unused imports.

---

## 3. Updates Needed to `v1_limitations.md`
Based on this audit, add the following to `v1_limitations.md`:

1.  **App Settings `data_directory_path`:** While the DB schema supports a custom data directory path, the UI and `update_app_settings` command do not currently allow changing it. It is fixed to `%APPDATA%\SecondBrain` for v1.
2.  **Browser Save while App is Closed:** The Native Messaging Host requires the desktop application to be running to successfully save items. If the app is closed, browser saves will fail silently (though the extension attempts to show a basic OS notification).
3.  **Promoted Tab UI State:** When a workspace tab is saved to the vault, its "unsaved" dot indicator will remain visible in the tab strip until closed, as the UI does not distinguish between a "draft" workspace document and a "promoted" one.
