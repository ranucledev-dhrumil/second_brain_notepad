const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\src\\lib.rs';
let content = fs.readFileSync(path, 'utf8');

// 1. Change inner function return type from Result<(), String> to Result<String, String>
content = content.replace(
  'pub fn save_workspace_document_to_vault_inner(\n    id: String,\n    conn: &mut rusqlite::Connection,\n) -> Result<(), String> {',
  'pub fn save_workspace_document_to_vault_inner(\n    id: String,\n    conn: &mut rusqlite::Connection,\n) -> Result<String, String> {'
);

// 2. After inserting into vault_items (new vault item branch), add the link update
// Add the link query right before the vault_id return in the else branch
content = content.replace(
  `        .map_err(|e| format!("save_workspace_document_to_vault insert: {}", e))?;
        vault_id
    };`,
  `        .map_err(|e| format!("save_workspace_document_to_vault insert: {}", e))?;

        // Link the workspace document to the new vault item
        tx.execute(
            "UPDATE workspace_documents SET source_vault_item_id = ?1 WHERE id = ?2",
            rusqlite::params![vault_id, id],
        )
        .map_err(|e| format!("save_workspace_document_to_vault link: {}", e))?;

        vault_id
    };`
);

// 3. Change Ok(()) to Ok(target_vault_id) at the end of the inner function
content = content.replace(
  '    tx.commit()\n        .map_err(|e| format!("save_workspace_document_to_vault commit: {}", e))?;\n\n    Ok(())\n}\n\n\n#[tauri::command]\nfn save_workspace_document_to_vault(\n    id: String,\n    state: tauri::State<db::DbState>,\n) -> Result<(), String> {\n    let mut guard = state.0.lock().map_err(|e| e.to_string())?;\n    save_workspace_document_to_vault_inner(id, &mut guard)\n}',
  `    tx.commit()
        .map_err(|e| format!("save_workspace_document_to_vault commit: {}", e))?;

    Ok(target_vault_id)
}


#[tauri::command]
fn save_workspace_document_to_vault(
    id: String,
    state: tauri::State<db::DbState>,
) -> Result<String, String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    save_workspace_document_to_vault_inner(id, &mut guard)
}

/// Renames the workspace document first (so dialog-confirmed title is the source of truth
/// for both the workspace tab and the vault item), then saves to vault.
#[tauri::command]
fn save_workspace_document_to_vault_with_title(
    id: String,
    title: String,
    state: tauri::State<db::DbState>,
) -> Result<String, String> {
    use chrono::Utc;
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    // Update the workspace document's title first — makes dialog title single source of truth.
    db::db_rename_workspace_document(&mut guard, &id, &title, &now)?;
    // Now save to vault (reads the updated title from DB).
    save_workspace_document_to_vault_inner(id, &mut guard)
}`
);

// 4. Register the new command in the invoke_handler
content = content.replace(
  '            save_workspace_document_to_vault,',
  '            save_workspace_document_to_vault,\n              save_workspace_document_to_vault_with_title,'
);

fs.writeFileSync(path, content, 'utf8');
console.log("lib.rs updated");
// Verify
const result = fs.readFileSync(path, 'utf8');
const checks = [
  'Result<String, String>',
  'save_workspace_document_to_vault_with_title',
  'Ok(target_vault_id)',
  'UPDATE workspace_documents SET source_vault_item_id',
];
checks.forEach(c => console.log(c + ':', result.includes(c) ? 'OK' : 'MISSING'));
