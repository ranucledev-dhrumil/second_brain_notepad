const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\hooks\\useTabs.ts';
let content = fs.readFileSync(path, 'utf8');

// ── 1. Add dirtyTabIds state and markVaultSaved to the interface ──────────
content = content.replace(
  `  updateUrl: (id: string, url: string | null) => void;
  saveError: string | null;
}`,
  `  updateUrl: (id: string, url: string | null) => void;
  saveError: string | null;
  /** Set of tab IDs that have un-synced changes (dot indicator). */
  dirtyTabIds: Set<string>;
  /** Called after a successful vault save — clears dirty state and links the tab. */
  markVaultSaved: (id: string, vaultItemId: string) => void;
}`
);

// ── 2. Add dirtyTabIds state after tabUrls state ──────────────────────────
content = content.replace(
  `  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);`,
  `  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  /** IDs of tabs whose content is not yet reflected in their linked Vault item (or have no link). */
  const [dirtyTabIds, setDirtyTabIds] = useState<Set<string>>(new Set());`
);

// ── 3. In loadOpenTabs: initialize dirtyTabIds (no link = dirty) ──────────
content = content.replace(
  `        setTabs(docs);
        const active = docs.find(d => d.isActive) ?? docs[0] ?? null;
        setActiveTabId(active?.id ?? null);
        const bodies: Record<string, string> = {};
        const urls: Record<string, string> = {};
        for (const doc of docs) {
          bodies[doc.id] = doc.body;
          urls[doc.id] = doc.url ?? '';
        }
        setTabBodies(bodies);
        setTabUrls(urls);`,
  `        setTabs(docs);
        const active = docs.find(d => d.isActive) ?? docs[0] ?? null;
        setActiveTabId(active?.id ?? null);
        const bodies: Record<string, string> = {};
        const urls: Record<string, string> = {};
        // Tabs without a vault link start dirty (dot shows). Linked tabs start clean.
        const initialDirty = new Set<string>(docs.filter(d => !d.sourceVaultItemId).map(d => d.id));
        setDirtyTabIds(initialDirty);
        for (const doc of docs) {
          bodies[doc.id] = doc.body;
          urls[doc.id] = doc.url ?? '';
        }
        setTabBodies(bodies);
        setTabUrls(urls);`
);

// ── 4. In createTab: new tab is always dirty ──────────────────────────────
content = content.replace(
  `    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      { ...doc, isActive: true },
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: '' }));
    setTabUrls(prev => ({ ...prev, [doc.id]: '' }));
  }, []);

  
  const openVaultItemForEdit`,
  `    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      { ...doc, isActive: true },
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: '' }));
    setTabUrls(prev => ({ ...prev, [doc.id]: '' }));
    setDirtyTabIds(prev => new Set(prev).add(doc.id));
  }, []);

  
  const openVaultItemForEdit`
);

// ── 5. In openVaultItemForEdit: tab starts CLEAN (it's linked) ────────────
content = content.replace(
  `    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      doc,
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: doc.body }));
    setTabUrls(prev => ({ ...prev, [doc.id]: doc.url || '' }));
    manuallyRenamedRef.current.add(doc.id);
  }, []);`,
  `    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      doc,
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: doc.body }));
    setTabUrls(prev => ({ ...prev, [doc.id]: doc.url || '' }));
    manuallyRenamedRef.current.add(doc.id);
    // Tab re-opened from vault starts clean — it's linked and in-sync.
    setDirtyTabIds(prev => { const next = new Set(prev); next.delete(doc.id); return next; });
  }, []);`
);

// ── 6. In captureTab: if sourceVaultItemId provided, start clean ──────────
content = content.replace(
  `    if (sourceVaultItemId) {
      manuallyRenamedRef.current.add(doc.id);
    }
  }, []);`,
  `    if (sourceVaultItemId) {
      manuallyRenamedRef.current.add(doc.id);
      // Captured from vault — starts clean.
      setDirtyTabIds(prev => { const next = new Set(prev); next.delete(doc.id); return next; });
    } else {
      setDirtyTabIds(prev => new Set(prev).add(doc.id));
    }
  }, []);`
);

// ── 7. Remove the 'saveToVault' special case from closeTab ────────────────
content = content.replace(
  `  const closeTab = useCallback(
    async (id: string, reason: 'explicit' | 'saveToVault' = 'explicit') => {`,
  `  const closeTab = useCallback(
    async (id: string) => {`
);

content = content.replace(
  `      // CHANGE 29: Quit the app when the last tab is closed explicitly (Notepad-style).
      if (remaining.length === 0) {
        if (reason === 'explicit') {
          await getCurrentWindow().close();
          return;
        } else {
          // If closed due to Save-to-Vault, just open a fresh Untitled tab instead of quitting
          const doc = await invoke<WorkspaceDocument>('new_workspace_document', {
            title: 'Untitled',
          });
          setTabs([ { ...doc, isActive: true } ]);
          setActiveTabId(doc.id);
          setTabBodies({ [doc.id]: '' });
          setTabUrls({ [doc.id]: '' });
          return;
        }
      }`,
  `      // CHANGE 29: Quit the app when the last tab is closed (Notepad-style).
      // Save-to-Vault via toolbar/Ctrl+S no longer closes tabs, so this only fires
      // on explicit close (X button, Ctrl+W, or close-dialog "Close without saving").
      if (remaining.length === 0) {
        await getCurrentWindow().close();
        return;
      }`
);

// ── 8. Update closeTab's tabUrls cleanup to also clean up dirtyTabIds ────
content = content.replace(
  `      setTabBodies(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [activeTabId, tabBodies, tabs],
  );`,
  `      setTabBodies(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDirtyTabIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    },
    [activeTabId, tabBodies, tabs],
  );`
);

// ── 9. In markDirty: add to dirtyTabIds ──────────────────────────────────
content = content.replace(
  `  const markDirty = useCallback((id: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }`,
  `  const markDirty = useCallback((id: string) => {
    setDirtyTabIds(prev => new Set(prev).add(id));
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }`
);

// ── 10. Add markVaultSaved callback ──────────────────────────────────────
content = content.replace(
  `  const updateSuggestedType = useCallback(async (id: string, type: ContentType) => {`,
  `  /** Called after a successful vault save. Clears the dirty indicator and links the tab. */
  const markVaultSaved = useCallback((id: string, vaultItemId: string) => {
    setDirtyTabIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    setTabs(prev => prev.map(t =>
      t.id === id ? { ...t, sourceVaultItemId: vaultItemId } : t
    ));
  }, []);

  const updateSuggestedType = useCallback(async (id: string, type: ContentType) => {`
);

// ── 11. Fix closeTab signature in the interface (remove reason param) ─────
content = content.replace(
  `  closeTab: (id: string, reason?: 'explicit' | 'saveToVault') => Promise<void>;`,
  `  closeTab: (id: string) => Promise<void>;`
);

// ── 12. Export dirtyTabIds and markVaultSaved ─────────────────────────────
content = content.replace(
  `    updateUrl,
    saveError,
  };
}`,
  `    updateUrl,
    saveError,
    dirtyTabIds,
    markVaultSaved,
  };
}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("useTabs.ts updated");

// Verify
const result = fs.readFileSync(path, 'utf8');
const checks = [
  'dirtyTabIds',
  'markVaultSaved',
  'setDirtyTabIds',
  'initialDirty',
  "async (id: string) => {",
  'Quit the app when the last tab is closed',
];
checks.forEach(c => console.log(c + ':', result.includes(c) ? 'OK' : 'MISSING'));
