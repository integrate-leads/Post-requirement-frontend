import React, { useState, useCallback, useEffect } from "react";
import { EmailBlock, GlobalStyles } from "./types";
import { TEMPLATES } from "./templates";
import { generateEmailHtml } from "./htmlGenerator";
import { EmailCanvas } from "./EmailCanvas";
import { InspectPanel } from "./InspectPanel";
import { useApi } from "@/hooks/useApi";

/** Template from API GET /email-broad/template */
export interface ApiEmailTemplate {
  id: number;
  adminId: number;
  name: string;
  subject: string;
  body: string;
  deleted: string;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = "editor" | "preview" | "html" | "json";
type DeviceMode = "desktop" | "mobile";

const TEMPLATE_PAGE_SIZE = 10;

export const EmailToolbox: React.FC = () => {
  const { endpoints, apiRequest } = useApi();
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
  const [editableHtml, setEditableHtml] = useState<string>("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateSubject, setSaveTemplateSubject] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<ApiEmailTemplate[]>([]);
  const [templatesPage, setTemplatesPage] = useState(1);
  const [totalTemplatePages, setTotalTemplatePages] = useState(1);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<ApiEmailTemplate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const generatedHtml = generateEmailHtml(blocks, globalStyles);
  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const prevViewModeRef = React.useRef<ViewMode>(viewMode);
  useEffect(() => {
    if (prevViewModeRef.current !== "html" && viewMode === "html") setEditableHtml(generatedHtml);
    prevViewModeRef.current = viewMode;
  }, [viewMode, generatedHtml]);

  const fetchTemplates = useCallback(
    async (page: number, append: boolean) => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      const url = endpoints.ADMIN.EMAIL_BROAD_TEMPLATE_LIST(page, TEMPLATE_PAGE_SIZE);
      const res = await apiRequest<{ data: ApiEmailTemplate[]; pagination: { totalPages: number } }>(url, { method: "GET" });
      setTemplatesLoading(false);
      if (res.error) {
        setTemplatesError(res.error);
        return;
      }
      if (res.data?.data) {
        setSavedTemplates((prev) => (append ? [...prev, ...res.data!.data!] : res.data!.data!));
        if (res.data.pagination) setTotalTemplatePages(res.data.pagination.totalPages);
      }
    },
    [endpoints.ADMIN, apiRequest]
  );

  useEffect(() => {
    fetchTemplates(1, false);
  }, [fetchTemplates]);

  const loadMoreTemplates = useCallback(() => {
    const next = templatesPage + 1;
    if (next <= totalTemplatePages && !templatesLoading) {
      setTemplatesPage(next);
      fetchTemplates(next, true);
    }
  }, [templatesPage, totalTemplatePages, templatesLoading, fetchTemplates]);

  const applyEditableHtml = useCallback(() => {
    // Keep block id in sync with editing template so Update still targets the same template
    const id = editingTemplateId != null ? `html-${editingTemplateId}` : `html-full-${Date.now()}`;
    setBlocks([{ id, type: "html", props: { content: editableHtml } }]);
    setSelectedId(id);
    setActiveTemplateId("");
    setViewMode("editor");
    setActiveRightTab("inspect");
  }, [editableHtml, editingTemplateId]);

  const openSaveModal = useCallback(() => {
    const t = editingTemplateId != null ? savedTemplates.find((x) => x.id === editingTemplateId) : null;
    setSaveTemplateName(t ? t.name : "");
    setSaveTemplateSubject(t ? t.subject : "");
    setSaveError(null);
    setSaveModalOpen(true);
  }, [editingTemplateId, savedTemplates]);

  const handleSaveTemplate = useCallback(async () => {
    // Body = current HTML output: from HTML tab (editable) if editing there, otherwise generated from editor
    const body = viewMode === "html" ? editableHtml : generatedHtml;
    const name = saveTemplateName.trim() || "Untitled template";
    const subject = saveTemplateSubject.trim() || "No subject";
    setSaveLoading(true);
    setSaveError(null);
    if (editingTemplateId != null) {
      const { error } = await apiRequest(endpoints.ADMIN.EMAIL_BROAD_TEMPLATE_UPDATE(editingTemplateId), {
        method: "PATCH",
        data: { name, subject, body },
      });
      setSaveLoading(false);
      if (error) {
        setSaveError(error);
        return;
      }
      // Sync editor and HTML Output (editable) with what was saved
      const blockId = `html-${editingTemplateId}`;
      setBlocks((prev) => prev.map((b) => (b.id === blockId || b.type === "html" ? { ...b, props: { ...b.props, content: body } } : b)));
      setEditableHtml(body);
      // Update the template in the sidebar in place so "the same one" stays visible (don't refetch page 1 only)
      setSavedTemplates((prev) => prev.map((t) => (t.id === editingTemplateId ? { ...t, name, subject, body, updatedAt: new Date().toISOString() } : t)));
      setSaveModalOpen(false);
      setSaveTemplateName("");
      setSaveTemplateSubject("");
      setSaveError(null);
    } else {
      const res = await apiRequest(endpoints.ADMIN.EMAIL_BROAD_TEMPLATE_CREATE, {
        method: "POST",
        data: { name, subject, body },
      });
      setSaveLoading(false);
      if (res.error) {
        setSaveError(res.error);
        return;
      }
      setSaveModalOpen(false);
      setSaveTemplateName("");
      setSaveTemplateSubject("");
      setEditingTemplateId(null);
      setSaveError(null);
      setTemplatesPage(1);
      fetchTemplates(1, false);
    }
  }, [saveTemplateName, saveTemplateSubject, editingTemplateId, viewMode, editableHtml, generatedHtml, endpoints.ADMIN, apiRequest, fetchTemplates]);

  const loadSavedTemplate = useCallback((t: ApiEmailTemplate) => {
    const blockId = `html-${t.id}`;
    setBlocks([{ id: blockId, type: "html", props: { content: t.body } }]);
    setEditableHtml(t.body);
    setSelectedId(blockId);
    setActiveTemplateId("");
    setEditingTemplateId(t.id);
    setActiveRightTab("inspect");
    setRightPanelCollapsed(false);
    setViewMode("editor");
  }, []);

  const openDeleteConfirm = useCallback((e: React.MouseEvent, t: ApiEmailTemplate) => {
    e.stopPropagation();
    setDeleteConfirmTemplate(t);
  }, []);

  const confirmDeleteTemplate = useCallback(async () => {
    if (!deleteConfirmTemplate) return;
    const id = deleteConfirmTemplate.id;
    setDeleteLoading(true);
    const { error } = await apiRequest(endpoints.ADMIN.EMAIL_BROAD_TEMPLATE_DELETE(id), { method: "DELETE" });
    setDeleteLoading(false);
    if (!error) {
      setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
      if (editingTemplateId === id) setEditingTemplateId(null);
      setDeleteConfirmTemplate(null);
    }
  }, [deleteConfirmTemplate, editingTemplateId, endpoints.ADMIN, apiRequest]);

  const loadTemplate = (templateId: string) => {
    const t = TEMPLATES.find((tpl) => tpl.id === templateId);
    if (!t) return;
    setBlocks(t.blocks.map((b) => ({ ...b, id: b.id + "-" + Date.now() })));
    setGlobalStyles(t.globalStyles);
    setSelectedId("");
    setActiveTemplateId(templateId);
    setEditingTemplateId(null);
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
          <ToolbarIcon onClick={openSaveModal} title="Save template">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
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
          <div className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
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
            {savedTemplates.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-4 pb-1">Saved</p>
                {savedTemplates.map((t) => (
                  <div key={t.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => loadSavedTemplate(t)}
                      className={`flex-1 text-left px-3 py-2 text-sm rounded-md transition-all duration-150 whitespace-nowrap ${
                        editingTemplateId === t.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      {t.name}
                    </button>
                    <button
                      onClick={(e) => openDeleteConfirm(e, t)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-600 rounded transition-all"
                      title="Delete saved template"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                ))}
                {templatesPage < totalTemplatePages && (
                  <button
                    type="button"
                    onClick={loadMoreTemplates}
                    disabled={templatesLoading}
                    className="w-full text-left px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-60"
                  >
                    {templatesLoading ? "Loading…" : "Show more"}
                  </button>
                )}
              </>
            )}
            {templatesError && (
              <p className="text-xs text-red-600 px-3 py-2">{templatesError}</p>
            )}
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
          <div className="flex-1 overflow-auto flex justify-center py-0 px-0" style={{ backgroundColor: globalStyles.backdropColor }}>
            <div style={{ width: deviceMode === "mobile" ? 375 : globalStyles.contentWidth, transition: "width 0.3s ease" }}>
              <iframe srcDoc={generatedHtml} className="w-full border-0 rounded" style={{ minHeight: 600, backgroundColor: globalStyles.canvasColor, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} title="Email Preview" sandbox="allow-same-origin" />
            </div>
          </div>
        )}

        {viewMode === "html" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HTML Output (editable)</span>
              <div className="flex items-center gap-2">
                <button onClick={applyEditableHtml} className="text-xs font-medium px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all">Apply HTML</button>
                <button onClick={() => { const html = editableHtml; navigator.clipboard.writeText(html); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${copied ? "bg-green-100 text-green-700" : "bg-foreground text-background hover:opacity-90"}`}>
                  {copied ? "✓ Copied!" : "Copy HTML"}
                </button>
                <button onClick={openSaveModal} className="text-xs font-medium px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-all">Save</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto" style={{ backgroundColor: "#0d1117" }}>
              <textarea
                value={editableHtml}
                onChange={(e) => setEditableHtml(e.target.value)}
                className="w-full h-full min-h-[400px] text-xs p-5 leading-relaxed resize-none focus:outline-none focus:ring-0"
                style={{ color: "#7ee787", fontFamily: "'SF Mono', Menlo, monospace", whiteSpace: "pre", wordBreak: "break-all", background: "transparent" }}
                spellCheck={false}
              />
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

      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => { setSaveModalOpen(false); setSaveError(null); }}>
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-1">{editingTemplateId != null ? "Update template" : "Save template"}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              The <strong>body</strong> will be the current HTML output (from the <strong>HTML</strong> tab if you have it open, otherwise from the editor).
            </p>
            <input
              type="text"
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              placeholder="Template name"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={saveTemplateSubject}
              onChange={(e) => setSaveTemplateSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {saveError && (
              <p className="text-xs text-red-600 mb-3" role="alert">{saveError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setSaveModalOpen(false); setSaveError(null); }} disabled={saveLoading} className="text-sm font-medium px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors disabled:opacity-60">Cancel</button>
              <button onClick={handleSaveTemplate} disabled={saveLoading} className="text-sm font-medium px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60">{saveLoading ? "Saving…" : editingTemplateId != null ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => !deleteLoading && setDeleteConfirmTemplate(null)}>
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete template</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Are you sure you want to delete <strong>"{deleteConfirmTemplate.name}"</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmTemplate(null)} disabled={deleteLoading} className="text-sm font-medium px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors disabled:opacity-60">Cancel</button>
              <button onClick={confirmDeleteTemplate} disabled={deleteLoading} className="text-sm font-medium px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60">{deleteLoading ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
