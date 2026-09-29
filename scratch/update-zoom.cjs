const fs = require('fs');

let str = fs.readFileSync('src/App.tsx', 'utf8');

// Add isZoomLoaded state
str = str.replace(
  /const \[zoom, setZoom\] = useState<number>\(100\);/,
  `const [zoom, setZoom] = useState<number>(100);\n  const [isZoomLoaded, setIsZoomLoaded] = useState<boolean>(false);`
);

// Update loadZoom to set isZoomLoaded
str = str.replace(
  /const loadZoom = \(\) => invoke<any>\('get_app_settings'\)\.then\(s => setZoom\(s\.editorZoom\)\)\.catch\(console\.error\);/,
  `const loadZoom = () => invoke<any>('get_app_settings').then(s => { setZoom(s.editorZoom); setIsZoomLoaded(true); }).catch(e => { console.error(e); setIsZoomLoaded(true); });`
);

// Change isLoading prop
str = str.replace(
  /isLoading=\{isSessionLoading\}/,
  `isLoading={isSessionLoading || !isZoomLoaded}`
);

fs.writeFileSync('src/App.tsx', str);
