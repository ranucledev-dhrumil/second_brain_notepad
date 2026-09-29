const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Attempt to load better-sqlite3 for DB verification
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error("Failed to load 'better-sqlite3'. Please ensure you ran 'npm install --save-dev better-sqlite3'.");
  process.exit(1);
}

// Config
const DB_PATH = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'SecondBrain', 'database.sqlite')
  : path.join(require('os').homedir(), 'AppData', 'Roaming', 'SecondBrain', 'database.sqlite');
  
const HOST_EXE_PATH = process.argv[2] || path.join(__dirname, '../second-brain-host/target/debug/second-brain-host.exe');

if (!fs.existsSync(HOST_EXE_PATH)) {
  console.error(`Host executable not found at: ${HOST_EXE_PATH}`);
  console.error("Please build it first or provide the path as the first argument.");
  process.exit(1);
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at: ${DB_PATH}`);
  console.error("Please ensure the Tauri application has been run at least once to create the database.");
  process.exit(1);
}

const db = new Database(DB_PATH, { fileMustExist: true });

// Ensure DB is not locked (i.e. Tauri app can handle writes)
db.pragma('journal_mode = WAL');

// Protocol utility
function sendMessage(proc, messageObj) {
  const json = JSON.stringify(messageObj);
  const buf = Buffer.from(json, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(buf.length, 0);
  proc.stdin.write(lenBuf);
  proc.stdin.write(buf);
}

async function runTest(testName, payload, expectedType, dbCheckUrl) {
  return new Promise((resolve, reject) => {
    console.log(`\n--- Running Test: ${testName} ---`);
    console.log(`Payload:`, payload);

    const proc = spawn(HOST_EXE_PATH, [], { stdio: ['pipe', 'pipe', 'inherit'] });
    let responseBuffer = Buffer.alloc(0);

    proc.stdout.on('data', (chunk) => {
      responseBuffer = Buffer.concat([responseBuffer, chunk]);
      
      if (responseBuffer.length >= 4) {
        const msgLen = responseBuffer.readUInt32LE(0);
        if (responseBuffer.length >= 4 + msgLen) {
          const msgBuf = responseBuffer.slice(4, 4 + msgLen);
          responseBuffer = responseBuffer.slice(4 + msgLen); // keep rest
          
          const responseStr = msgBuf.toString('utf8');
          console.log(`Host response:`, responseStr);
          
          try {
            const resp = JSON.parse(responseStr);
            if (!resp.ok) {
              return reject(new Error(`Host returned error: ${resp.error}`));
            }

            // Verify in DB
            // We use the unique URL to find the inserted row
            const row = db.prepare('SELECT * FROM vault_items WHERE source_url = ? ORDER BY created_at DESC LIMIT 1').get(dbCheckUrl);
            
            if (!row) {
              return reject(new Error(`Row with source_url '${dbCheckUrl}' not found in database.`));
            }
            
            console.log(`Found row in DB: ID=${row.id}, Type=${row.type}, Title="${row.title}"`);
            
            if (row.type !== expectedType) {
              return reject(new Error(`Expected type '${expectedType}', got '${row.type}'`));
            }
            if (payload.title && row.source_title !== payload.title) {
               console.warn(`Warning: source_title mismatch. Expected "${payload.title}", got "${row.source_title}"`);
            }
            
            // Clean up
            db.prepare('DELETE FROM vault_items WHERE id = ?').run(row.id);
            console.log(`[PASS] ${testName}`);
            resolve();
          } catch (e) {
            reject(e);
          }
        }
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn host: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0 && code !== null) {
         console.warn(`Host process exited with code ${code}`);
      }
    });

    // Send the message
    sendMessage(proc, {
      version: 1,
      action: "capture",
      payload
    });
  });
}

async function main() {
  console.log("=================================================");
  console.log(" Native Messaging Host - Automated Test Harness");
  console.log("=================================================");
  console.log(`Host EXE : ${HOST_EXE_PATH}`);
  console.log(`Database : ${DB_PATH}`);
  console.log("NOTE: The Second Brain desktop app MUST be running (e.g. 'npm run tauri dev')");
  console.log("      for these tests to pass, because the host acts as a proxy to the app.");
  console.log("=================================================");

  try {
    const timestamp = Date.now();
    
    // Test 1: Page Save (No selection) -> Type: Link
    const pageSaveUrl = `http://test-harness.local/page/${timestamp}`;
    await runTest('Page Save (No Selection)', {
      title: "Test Page Save Title",
      url: pageSaveUrl,
      selectedText: null,
      source: "chrome",
      timestamp: timestamp
    }, 'link', pageSaveUrl);

    // Test 2: Selection Save -> Type: Note
    const selectionSaveUrl = `http://test-harness.local/selection/${timestamp}`;
    await runTest('Selection Save', {
      title: "Test Selection Save Title",
      url: selectionSaveUrl,
      selectedText: "This is some selected text from the test harness.",
      source: "edge",
      timestamp: timestamp
    }, 'note', selectionSaveUrl);

    console.log("\n=================================================");
    console.log(" ALL TESTS PASSED SUCCESSFULLY! ✅");
    console.log("=================================================");
    console.log("Manual Verification Remaining:");
    console.log(" 1. Check the extension ID in Chrome/Edge matches the allowed_origins in the manifest.");
    console.log(" 2. Perform a real right-click 'Save page to Second Brain' in the browser to verify OS/browser plumbing.");
    console.log("=================================================");

  } catch (e) {
    console.error(`\n[FAIL] Test failed:`, e);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
