use rusqlite::Connection;
use std::path::PathBuf;
use uuid::Uuid;
use chrono::Utc;

fn data_dir() -> PathBuf {
    let appdata = std::env::var("APPDATA").expect("APPDATA not found");
    PathBuf::from(appdata).join("SecondBrain")
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 || args[1] != "--force-seed-real-data" {
        eprintln!("WARNING: You are about to run the seed script on the real database path!");
        eprintln!("This will DELETE ALL REAL DATA.");
        eprintln!("If you are absolutely sure, run with: seed --force-seed-real-data");
        std::process::exit(1);
    }

    println!("Seeding database with 5000 items and 20 workspace tabs...");
    let db_path = data_dir().join("database.sqlite");
    
    let mut conn = Connection::open(&db_path).expect("Failed to open DB");
    
    let tx = conn.transaction().expect("Failed to start transaction");

    tx.execute_batch("
        DELETE FROM workspace_documents;
        DELETE FROM vault_items;
        DELETE FROM vault_item_tags;
        DELETE FROM workspace_document_tags;
    ").expect("Failed to clear existing data");

    let types = ["note", "link", "codeSnippet"];
    for i in 0..5000 {
        let id = Uuid::new_v4().to_string();
        let title = format!("Generated Vault Item {}", i);
        let content_type = types[i % 3];
        
        let mut body = format!("This is the body of generated item {}.\n\n", i);
        if content_type == "note" && i % 10 == 0 {
            for j in 0..50 {
                body.push_str(&format!("## Heading {}\n- List item {}\n- Another list item\n\n**Bold text** and some more content to make this document larger. ", j, j));
            }
        } else if content_type == "codeSnippet" {
            body.push_str("```rust\nfn main() {\n    println!(\"Hello World\");\n}\n```");
        }
        
        let created_at = Utc::now().to_rfc3339();
        
        tx.execute(
            "INSERT INTO vault_items (id, title, body, type, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
            rusqlite::params![id, title, body, content_type, created_at]
        ).expect("Failed to insert vault item");

        if i % 2 == 0 {
            let tag = format!("tag{}", (i % 10) + 1);
            tx.execute(
                "INSERT INTO vault_item_tags (item_id, tag) VALUES (?1, ?2)",
                rusqlite::params![id, tag]
            ).expect("Failed to insert tag");
        }
    }

    for i in 0..20 {
        let id = Uuid::new_v4().to_string();
        let title = format!("Workspace Tab {}", i);
        let mut body = format!("# Workspace Tab {}\n\nStart typing here...\n\n", i);
        
        if i < 3 {
            for j in 0..200 {
                body.push_str(&format!("### Section {}\nHere is a bunch of text. **Bold**, *Italic*, and a [Link](https://example.com).\n\n* List item 1\n* List item 2\n\n```javascript\nfunction test() {{ return {{}}; }}\n```\n\n", j));
            }
        }

        tx.execute(
            "INSERT INTO workspace_documents (id, title, body, suggested_type, tab_order, created_at, updated_at) VALUES (?1, ?2, ?3, 'note', ?4, ?5, ?5)",
            rusqlite::params![id, title, body, i, Utc::now().to_rfc3339()]
        ).expect("Failed to insert workspace document");
    }

    tx.commit().expect("Failed to commit transaction");
    println!("Successfully seeded the database!");
}
