fn main() {
    let db_path = "test-corrupt-rust.sqlite";
    std::fs::write(db_path, "This is a garbage text file that is not a sqlite database at all.").unwrap();

    println!("Before open: {} bytes", std::fs::metadata(db_path).unwrap().len());
    
    let mut conn = match rusqlite::Connection::open(db_path) {
        Ok(c) => {
            println!("Opened OK");
            c
        },
        Err(e) => {
            println!("Open failed: {}", e);
            return;
        }
    };

    if let Err(e) = conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;") {
        println!("Pragma failed: {}", e);
    } else {
        println!("Pragma OK");
    }

    match conn.query_row("PRAGMA quick_check", [], |row| row.get::<_, String>(0)) {
        Ok(v) => println!("Check: {}", v),
        Err(e) => println!("Check failed: {}", e),
    }

    println!("After all: {} bytes", std::fs::metadata(db_path).unwrap().len());
}
