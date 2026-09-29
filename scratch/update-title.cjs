const fs = require('fs');

let str = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');

const newFunc = `  const updateAutoTitle = useCallback((id: string, body: string, isCodeMode?: boolean) => {
    if (manuallyRenamedRef.current.has(id)) return;
    
    let firstLine = '';
    
    if (isCodeMode) {
      // Find first non-empty line inside or outside fences, skip backticks
      const lines = body.split('\\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('\`\`\`')) {
          firstLine = line;
          break;
        }
      }
    } else {
      firstLine = body.trimStart().split('\\n')[0].replace(/^#+\\s*/, '').trim();
    }
    
    const derived = firstLine.length > AUTO_TITLE_MAX_CHARS
      ? firstLine.slice(0, AUTO_TITLE_MAX_CHARS) + '.'
      : firstLine || 'Untitled';
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, title: derived } : t)));
  }, []);`;

str = str.replace(/  const updateAutoTitle = useCallback\(\(id: string, body: string\) => \{[\s\S]*?\}, \[\]\);/, newFunc);

fs.writeFileSync('src/hooks/useTabs.ts', str);
