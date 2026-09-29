const fs = require('fs');

let str = fs.readFileSync('src/components/VaultBrowser/VaultBrowser.tsx', 'utf8');

str = str.replace(
  /const all: string\[\] = await invoke\('get_all_tags'\);\n\s*setAllTags\(all\);\n\s*\} catch \(e\) \{/,
  `const all: string[] = await invoke('get_all_tags');
      setAllTags(all);
      // Reload items to reflect tag filtering changes
      void loadItems();
    } catch (e) {`
);

str = str.replace(
  /import \{ NoteIcon, CodeIcon, LinkIcon, ImageIcon, FileIcon \} from '\.\.\/Icons\/Icons';/,
  `import { NoteIcon, CodeIcon, LinkIcon, ImageIcon, FileIcon } from '../Icons/Icons';
import { listen } from '@tauri-apps/api/event';`
);

str = str.replace(
  /  useEffect\(\(\) => \{\n    void loadItems\(\);\n  \}, \[loadItems\]\);/,
  `  useEffect(() => {
    void loadItems();
    const unlisten = listen('browser-capture-saved', () => loadItems());
    return () => {
      unlisten.then(f => f());
    };
  }, [loadItems]);`
);

fs.writeFileSync('src/components/VaultBrowser/VaultBrowser.tsx', str);
