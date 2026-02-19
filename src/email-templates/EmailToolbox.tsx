import React, { useState, useCallback } from "react";
import { EmailBlock, GlobalStyles } from "./types";
import { TEMPLATES } from "./templates";
import { generateEmailHtml } from "./htmlGenerator";
import { EmailCanvas } from "./EmailCanvas";
import { InspectPanel } from "./InspectPanel";

type ViewMode = "editor" | "preview" | "html" | "json";
type DeviceMode = "desktop" | "mobile";

export const EmailToolbox: React.FC = () => {
  const [blocks, setBlocks] = useState<EmailBlock[]>(TEMPLATES[1].blocks.map((b) => ({ ...b, id: b.id + "-i" })));
  const [activeTemplateId, setActiveTemplateId] = useState<string>("welcome");
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>(TEMPLATES[1].globalStyles);
  const [selectedId, setSelectedId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"styles" | "inspect">("styles");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const generatedHtml = generateEmailHtml(blocks, globalStyles);
  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const loadTemplate = (templateId: string) => {
    const t = TEMPLATES.find((tpl) => tpl.id === templateId);
    if (!t) return;
    setBlocks(t.blocks.map((b) => ({ ...b, id: b.id + "-" + Date.now() })));
    setGlobalStyles(t.globalStyles);
    setSelectedId("");
    setActiveTemplateId(templateId);
  };

  const handleAddBlock = useCallback((block: EmailBlock, afterIndex?: number) => {
    setBlocks((prev) => {
      if (afterIndex !== undefined && afterIndex >= -1) {
        const next = [...prev];
        next.splice(afterIndex + 1, 0, block);
        return next;
      }
      return [...prev, block];
    });
    setSelectedId(block.id);
    setActiveRightTab("inspect");
    setActiveTemplateId("");
  }, []);

  const handleUpdate = useCallback((updated: EmailBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId("");
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const source = prev[idx];
      const dup: EmailBlock = {
        ...source,
        id: `${source.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        props: JSON.parse(JSON.stringify(source.props)),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
  }, []);

  const handleMove = useCallback((id: string, dir: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "email-template.html";
    a.click();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.blocks) setBlocks(data.blocks);
        if (data.globalStyles) setGlobalStyles(data.globalStyles);
        setActiveTemplateId("");
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  };

  const jsonStr = JSON.stringify({ globalStyles, blocks }, null, 2);

  const ToolbarIcon: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }> = ({ active, onClick, children, title }) => (
    <button onClick={onClick} title={title} className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-150 ${active ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>{children}</button>
  );

  const ToolbarSep = () => <div className="w-px h-5 bg-border mx-1" />;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background flex-1" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header className="flex items-center justify-between px-2 border-b border-border bg-card h-11 shrink-0 z-10">
        <div className="flex items-center gap-0.5">
          <ToolbarIcon onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" style={{ transition: 'transform 0.2s', transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transformOrigin: 'center' }} /></svg>
          </ToolbarIcon>
          <ToolbarSep />
          <ToolbarIcon active={viewMode === "editor"} onClick={() => setViewMode("editor")} title="Editor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
          </ToolbarIcon>
          <ToolbarIcon active={viewMode === "preview"} onClick={() => setViewMode("preview")} title="Preview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
          </ToolbarIcon>
          <ToolbarIcon active={viewMode === "html"} onClick={() => setViewMode("html")} title="HTML">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </ToolbarIcon>
          <ToolbarIcon active={viewMode === "json"} onClick={() => setViewMode("json")} title="JSON">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
          </ToolbarIcon>
        </div>

        <div className="flex items-center gap-0.5">
          <ToolbarIcon onClick={handleDownloadHtml} title="Download HTML">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </ToolbarIcon>
          <label className="cursor-pointer" title="Import JSON">
            <ToolbarIcon onClick={() => {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </ToolbarIcon>
            <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
          </label>
          <ToolbarSep />
          <ToolbarIcon active={deviceMode === "desktop"} onClick={() => setDeviceMode("desktop")} title="Desktop">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </ToolbarIcon>
          <ToolbarIcon active={deviceMode === "mobile"} onClick={() => setDeviceMode("mobile")} title="Mobile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
          </ToolbarIcon>
          <ToolbarSep />
          <ToolbarIcon onClick={handleCopyHtml} title="Copy HTML">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </ToolbarIcon>
          <ToolbarSep />
          <ToolbarIcon onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} title="Toggle panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" style={{ transition: 'transform 0.2s', transform: rightPanelCollapsed ? 'rotate(180deg)' : 'none', transformOrigin: 'center' }} /></svg>
          </ToolbarIcon>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="shrink-0 flex flex-col border-r border-border bg-card overflow-y-auto transition-all duration-300"
          style={{ width: sidebarCollapsed ? 0 : 180, opacity: sidebarCollapsed ? 0 : 1 }}
        >
          <div className="px-4 py-3 border-b border-border">
            <h1 className="text-sm font-bold text-foreground whitespace-nowrap">Templates</h1>
          </div>
          <div className="flex-1 p-1.5 space-y-0.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => loadTemplate(t.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-150 whitespace-nowrap ${
                  activeTemplateId === t.id
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </aside>

        {viewMode === "editor" && (
          <EmailCanvas
            blocks={blocks}
            selectedId={selectedId}
            globalStyles={globalStyles}
            onSelect={(id) => { setSelectedId(id ?? ""); if (id) setActiveRightTab("inspect"); }}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onMove={handleMove}
            onAddBlock={handleAddBlock}
            deviceMode={deviceMode}
          />
        )}

        {viewMode === "preview" && (
          <div className="flex-1 overflow-auto flex justify-center py-8 px-4" style={{ backgroundColor: globalStyles.backdropColor }}>
            <div style={{ width: deviceMode === "mobile" ? 375 : globalStyles.contentWidth, transition: "width 0.3s ease" }}>
              <iframe srcDoc={generatedHtml} className="w-full border-0 rounded" style={{ minHeight: 600, backgroundColor: globalStyles.canvasColor, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} title="Email Preview" sandbox="allow-same-origin" />
            </div>
          </div>
        )}

        {viewMode === "html" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HTML Output</span>
              <button onClick={handleCopyHtml} className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${copied ? "bg-green-100 text-green-700" : "bg-foreground text-background hover:opacity-90"}`}>
                {copied ? "✓ Copied!" : "Copy HTML"}
              </button>
            </div>
            <div className="flex-1 overflow-auto" style={{ backgroundColor: "#0d1117" }}>
              <pre className="text-xs p-5 leading-relaxed" style={{ color: "#7ee787", fontFamily: "'SF Mono', Menlo, monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{generatedHtml}</pre>
            </div>
          </div>
        )}

        {viewMode === "json" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">JSON Schema</span>
              <button onClick={() => navigator.clipboard.writeText(jsonStr)} className="text-xs font-medium px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-all">Copy JSON</button>
            </div>
            <div className="flex-1 overflow-auto" style={{ backgroundColor: "#0d1117" }}>
              <pre className="text-xs p-5 leading-relaxed" style={{ color: "#79c0ff", fontFamily: "'SF Mono', Menlo, monospace", whiteSpace: "pre-wrap" }}>{jsonStr}</pre>
            </div>
          </div>
        )}

        {viewMode === "editor" && !rightPanelCollapsed && (
          <InspectPanel
            globalStyles={globalStyles}
            selectedBlock={selectedBlock}
            onGlobalChange={(patch) => setGlobalStyles((g) => ({ ...g, ...patch }))}
            onBlockUpdate={handleUpdate}
            activeTab={activeRightTab}
            onTabChange={setActiveRightTab}
          />
        )}
      </div>

      {copied && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl z-50 flex items-center gap-2" style={{ animation: "fadeInUp 0.2s ease-out" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          HTML copied to clipboard
        </div>
      )}
    </div>
  );
};
