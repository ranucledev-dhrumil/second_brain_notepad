fn main() {
    let db_path = "test-corrupt-empty.sqlite";
    std::fs::write(db_path, "").unwrap();

    println!("Before open: {} bytes", std::fs::metadata(db_path).unwrap().len());
    
    let conn = match rusqlite::Connection::open(db_path) {
        Ok(c) => c,
        Err(e) => {
            println!("Open failed: {}", e);
            return;
        }
    };

    match conn.query_row("PRAGMA quick_check", [], |row| row.get::<_, String>(0)) {
        Ok(v) => println!("Check: {}", v),
        Err(e) => println!("Check failed: {}", e),
    }

    if let Err(e) = conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;") {
        println!("Pragma failed: {}", e);
    }
    
    // Some query that makes sqlite write to it
    conn.execute_batch("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)").unwrap();

    println!("After all: {} bytes", std::fs::metadata(db_path).unwrap().len());
}
