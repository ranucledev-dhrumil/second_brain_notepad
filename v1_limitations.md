# Second Brain: v1 Limitations

This document outlines known limitations and out-of-scope features for the v1 release of the Second Brain application.

### Vault
*   **No Tag Rename/Merge:** Tag names cannot be globally renamed or merged.
*   **No Bulk Operations:** Tags and content types cannot be modified across multiple items simultaneously.
*   **No At-Rest Encryption:** The SQLite database is not encrypted at rest. Rely on OS-level encryption (BitLocker, FileVault) for securing the database file.

### Workspace
*   **No Closed-Tab Browser:** Once a workspace tab is closed (and not saved to the Vault), it is removed from the active session. There is currently no UI to browse or reopen closed workspace tabs, though they remain in the database schema.
*   **Tab Limit:** While the layout handles scrolling tabs, performance may degrade gracefully if hundreds of tabs are kept open simultaneously.
*   **Promoted Tab UI State:** When a workspace tab is saved to the vault, its dot indicator stays visible after saving to the Vault until the tab is closed. The UI does not distinguish between a draft workspace document and a promoted one.

### Editor
*   **No Nested Lists/Code Blocks:** The rich-text editor focuses on core formatting. Complex structures like nested code blocks inside blockquotes are not explicitly styled or supported.
*   **Editor Modes (Code/Link):** Link to Code keeps the URL in its own field but hidden, and it is only inserted as a hyperlink on Link to Note. Switching a formatted note to Code shows its Markdown source in the code block.

### General
*   **Single-Window Only:** The application only supports a single active window.
*   **Fixed Data Location:** The data location is fixed at `%APPDATA%\\SecondBrain`. While the DB schema has a `data_directory_path` setting, the UI and API do not currently allow changing it.
*   **Browser Save Requires App Running:** Browser saves need the desktop app running and are dropped with a notification if it is closed. 
*   **Capture Duplicate Protection:** Duplicate protection is time-window based (5 seconds for browser saves, 3 seconds for hotkey captures) and silently drops identical rapid re-captures.
