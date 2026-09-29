use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;

fn main() {
    let appdata = "D:\\Phase-3\\Second_Brain_Notes\\second-brain\\scratch\\test-appdata";
    let dir = PathBuf::from(appdata).join("SecondBrain");
    let db_path = dir.join("database.sqlite");

    println!("Testing db_path: {:?}", db_path);
    let is_existing_db = fs::metadata(&db_path).map(|m| m.len() > 0).unwrap_or(false);

    let mut conn = Connection::open(&db_path).unwrap();

    if is_existing_db {
        let integrity_check = conn.query_row("PRAGMA quick_check", [], |row| row.get::<_, String>(0));
        match integrity_check {
            Ok(res) if res.to_lowercase() != "ok" => {
                println!("CORRUPTION_DETECTED (Ok-Not-Ok): {}", res);
            }
            Err(e) => {
                println!("CORRUPTION_DETECTED (Err): {}", e);
            }
            _ => {
                println!("Healthy database!");
            }
        }
    }
}
