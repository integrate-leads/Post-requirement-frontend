import React from "react";
import { EmailBlock, GlobalStyles, BLOCK_META } from "./types";

const FONT_OPTIONS = [
  { value: "Arial, Helvetica, sans-serif", label: "Modern sans" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
];

interface Props {
  globalStyles: GlobalStyles;
  selectedBlock: EmailBlock | null;
  onGlobalChange: (patch: Partial<GlobalStyles>) => void;
  onBlockUpdate: (b: EmailBlock) => void;
  activeTab: "styles" | "inspect";
  onTabChange: (tab: "styles" | "inspect") => void;
}

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void; nullable?: boolean }> = ({ label, value, onChange, nullable = false }) => {
  const hasValue = value && value !== "" && value !== "transparent";
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
      {hasValue || !nullable ? (
        <div className="flex items-center gap-2">
          <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{value}</span>
          {nullable && (
            <button onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 border border-border rounded transition-colors" title="Remove">✕</button>
          )}
        </div>
      ) : (
        <button
          onClick={() => onChange("#000000")}
          className="w-8 h-8 rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          title="Add color"
        >
          <span className="text-base leading-none">+</span>
        </button>
      )}
    </div>
  );
};

const SliderField: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string; icon?: string }> = ({ label, value, onChange, min, max, step = 1, unit = "px", icon }) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
    <div className="flex items-center gap-2">
      {icon && <span className="text-sm text-muted-foreground w-4 text-center">{icon}</span>}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#2563eb' }} />
      <span className="text-xs text-muted-foreground w-10 text-right tabular-nums font-mono">{value}{unit}</span>
    </div>
  </div>
);

const AlignmentField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options?: string[] }> = ({ label, value, onChange, options = ["left", "center", "right"] }) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
    <div className="flex border border-border rounded-md overflow-hidden">
      {options.map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${value === a ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"}`}
        >
          {a === "left" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
          ) : a === "center" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>
      ))}
    </div>
  </div>
);

const SelectField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const InspectPanel: React.FC<Props> = ({
  globalStyles,
  selectedBlock,
  onGlobalChange,
  onBlockUpdate,
  activeTab,
  onTabChange,
}) => {
  const p = selectedBlock?.props as Record<string, unknown> | undefined;

  const updateProp = (key: string, value: unknown) => {
    if (!selectedBlock) return;
    onBlockUpdate({ ...selectedBlock, props: { ...selectedBlock.props, [key]: value } });
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col border-l border-border bg-card overflow-hidden">
      <div className="flex border-b border-border">
        <button onClick={() => onTabChange("styles")} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "styles" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"}`}>Styles</button>
        <button onClick={() => onTabChange("inspect")} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "inspect" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"}`}>Inspect</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "styles" && (
          <div className="p-5 space-y-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Global</p>
            <ColorField label="Backdrop color" value={globalStyles.backdropColor} onChange={(v) => onGlobalChange({ backdropColor: v })} />
            <ColorField label="Canvas color" value={globalStyles.canvasColor} onChange={(v) => onGlobalChange({ canvasColor: v })} />
            <ColorField label="Canvas border color" value={globalStyles.canvasBorderColor} onChange={(v) => onGlobalChange({ canvasBorderColor: v })} nullable />
            <SliderField label="Canvas border radius" value={globalStyles.canvasBorderRadius} onChange={(v) => onGlobalChange({ canvasBorderRadius: v })} min={0} max={24} icon="⊡" />
            <SliderField label="Content width" value={globalStyles.contentWidth} onChange={(v) => onGlobalChange({ contentWidth: v })} min={320} max={800} />
            <SelectField label="Font family" value={globalStyles.fontFamily} onChange={(v) => onGlobalChange({ fontFamily: v })} options={FONT_OPTIONS} />
            <ColorField label="Text color" value={globalStyles.textColor} onChange={(v) => onGlobalChange({ textColor: v })} />
          </div>
        )}

        {activeTab === "inspect" && (
          <div className="p-5">
            {!selectedBlock ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Click on a block to inspect</p>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {BLOCK_META[selectedBlock.type]?.label || selectedBlock.type} Block
                </p>

                {selectedBlock.type === "html" && (() => {
                  const content = (p?.content as string) || "";
                  const isFullHtml = typeof content === "string" && (content.trim().toLowerCase().startsWith("<!doctype") || content.trim().toLowerCase().startsWith("<html"));
                  return (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">HTML Content</label>
                        <textarea
                          value={content}
                          onChange={(e) => updateProp("content", e.target.value)}
                          placeholder="Paste HTML here… supports full email templates"
                          className="w-full border border-border rounded-md px-3 py-2 text-xs font-mono bg-background resize-y min-h-[180px] leading-relaxed"
                          rows={10}
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {isFullHtml ? "📄 Full HTML template detected — rendered in sandbox" : "Tip: Paste a full HTML email template for sandboxed preview"}
                        </p>
                      </div>
                      {!isFullHtml && (
                        <>
                          <ColorField label="Text color" value={(p?.color as string) || ""} onChange={(v) => updateProp("color", v)} nullable />
                          <ColorField label="Background color" value={(p?.backgroundColor as string) || ""} onChange={(v) => updateProp("backgroundColor", v)} nullable />
                          <SelectField label="Font family" value={(p?.fontFamily as string) || ""} onChange={(v) => updateProp("fontFamily", v)} options={[{ value: "", label: "Match email settings" }, ...FONT_OPTIONS]} />
                          <SliderField label="Font size" value={(p?.fontSize as number) || 16} onChange={(v) => updateProp("fontSize", v)} min={10} max={72} icon="T" />
                          <AlignmentField label="Alignment" value={(p?.textAlign as string) || "left"} onChange={(v) => updateProp("textAlign", v)} />
                        </>
                      )}
                    </>
                  );
                })()}

                {selectedBlock.type === "heading" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Heading text</label>
                      <input type="text" value={(p?.text as string) || ""} onChange={(e) => updateProp("text", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="Heading" />
                    </div>
                    <SelectField label="Heading level" value={(p?.level as string) || "h2"} onChange={(v) => updateProp("level", v)} options={[{value:"h1",label:"H1"},{value:"h2",label:"H2"},{value:"h3",label:"H3"},{value:"h4",label:"H4"}]} />
                    <SelectField label="Font weight" value={(p?.fontWeight as string) || "bold"} onChange={(v) => updateProp("fontWeight", v)} options={[{ value: "normal", label: "Normal" }, { value: "600", label: "Semi-bold" }, { value: "bold", label: "Bold" }]} />
                    <ColorField label="Text color" value={(p?.color as string) || ""} onChange={(v) => updateProp("color", v)} nullable />
                    <ColorField label="Background color" value={(p?.backgroundColor as string) || ""} onChange={(v) => updateProp("backgroundColor", v)} nullable />
                    <SelectField label="Font family" value={(p?.fontFamily as string) || ""} onChange={(v) => updateProp("fontFamily", v)} options={[{ value: "", label: "Match email settings" }, ...FONT_OPTIONS]} />
                    <SliderField label="Font size" value={(p?.fontSize as number) || 32} onChange={(v) => updateProp("fontSize", v)} min={12} max={72} icon="T" />
                    <AlignmentField label="Alignment" value={(p?.textAlign as string) || "left"} onChange={(v) => updateProp("textAlign", v)} />
                  </>
                )}

                {selectedBlock.type === "text" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Content</label>
                      <textarea value={(p?.text as string) || ""} onChange={(e) => updateProp("text", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y min-h-[80px]" placeholder="Paragraph text" rows={3} />
                    </div>
                    <ColorField label="Text color" value={(p?.color as string) || ""} onChange={(v) => updateProp("color", v)} nullable />
                    <ColorField label="Background color" value={(p?.backgroundColor as string) || ""} onChange={(v) => updateProp("backgroundColor", v)} nullable />
                    <SelectField label="Font family" value={(p?.fontFamily as string) || ""} onChange={(v) => updateProp("fontFamily", v)} options={[{ value: "", label: "Match email settings" }, ...FONT_OPTIONS]} />
                    <SliderField label="Font size" value={(p?.fontSize as number) || 16} onChange={(v) => updateProp("fontSize", v)} min={10} max={48} icon="T" />
                    <SliderField label="Line height" value={typeof p?.lineHeight === "number" ? p.lineHeight : 1.5} onChange={(v) => updateProp("lineHeight", v)} min={1} max={3} step={0.1} unit="" />
                    <AlignmentField label="Alignment" value={(p?.textAlign as string) || "left"} onChange={(v) => updateProp("textAlign", v)} />
                  </>
                )}

                {selectedBlock.type === "button" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Button text</label>
                      <input type="text" value={(p?.text as string) || ""} onChange={(e) => updateProp("text", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="Click here" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">URL</label>
                      <input type="url" value={(p?.url as string) || ""} onChange={(e) => updateProp("url", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="https://" />
                    </div>
                    <ColorField label="Background color" value={(p?.backgroundColor as string) || "#2563eb"} onChange={(v) => updateProp("backgroundColor", v)} />
                    <ColorField label="Text color" value={(p?.color as string) || "#ffffff"} onChange={(v) => updateProp("color", v)} />
                    <SelectField label="Font family" value={(p?.fontFamily as string) || ""} onChange={(v) => updateProp("fontFamily", v)} options={[{ value: "", label: "Match email settings" }, ...FONT_OPTIONS]} />
                    <SelectField label="Font weight" value={(p?.fontWeight as string) || "600"} onChange={(v) => updateProp("fontWeight", v)} options={[{ value: "normal", label: "Normal" }, { value: "600", label: "Semi-bold" }, { value: "bold", label: "Bold" }]} />
                    <SliderField label="Font size" value={(p?.fontSize as number) || 16} onChange={(v) => updateProp("fontSize", v)} min={10} max={32} icon="T" />
                    <SliderField label="Border radius" value={(p?.borderRadius as number) || 4} onChange={(v) => updateProp("borderRadius", v)} min={0} max={24} icon="⊡" />
                    <AlignmentField label="Alignment" value={(p?.align as string) || "center"} onChange={(v) => updateProp("align", v)} />
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Full width</label>
                      <button onClick={() => updateProp("fullWidth", !p?.fullWidth)} className={`w-9 h-5 rounded-full transition-colors ${p?.fullWidth ? "bg-blue-600" : "bg-gray-300"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${p?.fullWidth ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Button padding</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["top", "right", "bottom", "left"] as const).map((side) => (
                          <div key={side}>
                            <label className="text-xs text-muted-foreground capitalize mb-1 block">{side}</label>
                            <input
                              type="number"
                              value={((p?.buttonPadding as Record<string, number>)?.[side] ?? (side === "top" || side === "bottom" ? 12 : 24)) as number}
                              onChange={(e) => updateProp("buttonPadding", { ...((p?.buttonPadding as Record<string, number>) || { top: 12, right: 24, bottom: 12, left: 24 }), [side]: Number(e.target.value) })}
                              className="w-full border border-border rounded px-2 py-1 text-xs bg-background tabular-nums"
                              min={0}
                              max={48}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedBlock.type === "image" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Image URL</label>
                      <input value={(p?.url as string) || ""} onChange={(e) => updateProp("url", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="https://" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Alt text</label>
                      <input value={(p?.alt as string) || ""} onChange={(e) => updateProp("alt", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="(optional)" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Width</label>
                      <input value={(p?.width as string) || "100%"} onChange={(e) => updateProp("width", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="100% or 400px" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Link URL</label>
                      <input value={(p?.linkUrl as string) || ""} onChange={(e) => updateProp("linkUrl", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="(optional)" />
                    </div>
                    <AlignmentField label="Alignment" value={(p?.align as string) || "center"} onChange={(v) => updateProp("align", v)} />
                    <SelectField label="Vertical align" value={(p?.contentAlignment as string) || "middle"} onChange={(v) => updateProp("contentAlignment", v)} options={[{ value: "top", label: "Top" }, { value: "middle", label: "Middle" }, { value: "bottom", label: "Bottom" }]} />
                  </>
                )}

                {selectedBlock.type === "divider" && (
                  <>
                    <ColorField label="Color" value={(p?.color as string) || "#e5e7eb"} onChange={(v) => updateProp("color", v)} />
                    <SliderField label="Thickness" value={(p?.lineHeight as number) || 1} onChange={(v) => updateProp("lineHeight", v)} min={1} max={8} />
                  </>
                )}

                {selectedBlock.type === "spacer" && (
                  <SliderField label="Height" value={(p?.height as number) || 16} onChange={(v) => updateProp("height", v)} min={4} max={120} />
                )}

                {selectedBlock.type === "avatar" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Image URL</label>
                      <input value={(p?.src as string) || ""} onChange={(e) => updateProp("src", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="https://" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Alt text</label>
                      <input value={(p?.alt as string) || ""} onChange={(e) => updateProp("alt", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="(optional)" />
                    </div>
                    <SliderField label="Size" value={(p?.size as number) || 64} onChange={(v) => updateProp("size", v)} min={24} max={200} />
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Shape</label>
                      <div className="flex border border-border rounded-md overflow-hidden">
                        {["circle", "square"].map((s) => (
                          <button key={s} onClick={() => updateProp("shape", s)} className={`flex-1 py-2 text-xs font-medium capitalize ${p?.shape === s || (!p?.shape && s === "circle") ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <AlignmentField label="Alignment" value={(p?.align as string) || "center"} onChange={(v) => updateProp("align", v)} />
                  </>
                )}

                {selectedBlock.type === "container" && (
                  <>
                    <ColorField label="Background color" value={(p?.backgroundColor as string) || ""} onChange={(v) => updateProp("backgroundColor", v)} nullable />
                    <ColorField label="Border color" value={(p?.borderColor as string) || "#e5e7eb"} onChange={(v) => updateProp("borderColor", v)} nullable />
                    <SliderField label="Border radius" value={(p?.borderRadius as number) || 0} onChange={(v) => updateProp("borderRadius", v)} min={0} max={24} icon="⊡" />
                  </>
                )}

                {selectedBlock.type === "columns" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Number of columns</label>
                      <div className="flex border border-border rounded-md overflow-hidden">
                        {[2, 3, 4].map((n) => (
                          <button key={n} onClick={() => {
                            const cols = Array.from({ length: n }, () => ({ children: [] }));
                            updateProp("columns", cols);
                            updateProp("count", n);
                          }} className={`flex-1 py-2 text-xs font-medium ${(p?.count || 2) === n ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                    <SliderField label="Gap" value={(p?.gap as number) || 16} onChange={(v) => updateProp("gap", v)} min={0} max={48} />
                  </>
                )}

                {selectedBlock && p?.padding && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Padding</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["top", "right", "bottom", "left"] as const).map((side) => (
                        <div key={side}>
                          <label className="text-xs text-muted-foreground capitalize mb-1 block">{side}</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={((p.padding as Record<string, number>)?.[side] ?? 0) as number}
                              onChange={(e) => updateProp("padding", { ...(p.padding as object), [side]: Number(e.target.value) })}
                              className="w-full border border-border rounded px-2 py-1 text-xs bg-background tabular-nums"
                              min={0}
                              max={80}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">Type: <span className="font-mono">{selectedBlock.type}</span></p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
