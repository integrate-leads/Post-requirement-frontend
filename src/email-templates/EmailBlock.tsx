import React from "react";
import { EmailBlock as EmailBlockType } from "./types";

interface Props {
  block: EmailBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (b: EmailBlockType) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const EmailBlockRenderer: React.FC<Props> = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  isFirst,
  isLast,
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const updateProp = (key: string, value: unknown) => {
    onUpdate({ ...block, props: { ...block.props, [key]: value } });
  };

  const p = block.props as Record<string, unknown>;

  const renderContent = () => {
    switch (block.type) {
      case "heading":
        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px`, textAlign: (p.textAlign as string) || "left", backgroundColor: (p.backgroundColor as string) || "transparent" }}>
            {isSelected ? (
              <input
                value={p.text as string}
                onChange={(e) => updateProp("text", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="outline-none bg-transparent w-full"
                style={{ color: p.color || "inherit", fontSize: `${p.fontSize || 32}px`, fontWeight: p.fontWeight || "bold", textAlign: (p.textAlign as string) || "left", fontFamily: (p.fontFamily as string) || "inherit" } as React.CSSProperties}
              />
            ) : (
              React.createElement(
                (p.level as string) || "h2",
                { style: { margin: 0, color: p.color || "inherit", fontSize: `${p.fontSize || 32}px`, fontWeight: p.fontWeight || "bold", fontFamily: (p.fontFamily as string) || "inherit" } },
                p.text
              )
            )}
          </div>
        );

      case "text":
        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px`, textAlign: (p.textAlign as string) || "left", backgroundColor: (p.backgroundColor as string) || "transparent" }}>
            {isSelected ? (
              <textarea
                value={p.text as string}
                onChange={(e) => updateProp("text", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="outline-none bg-transparent w-full resize-none"
                style={{ color: p.color || "inherit", fontSize: `${p.fontSize || 16}px`, lineHeight: (p.lineHeight as number) || 1.5, fontFamily: (p.fontFamily as string) || "inherit", minHeight: 60, textAlign: (p.textAlign as string) || "left" } as React.CSSProperties}
                rows={3}
              />
            ) : (
              <p style={{ margin: 0, color: p.color || "inherit", fontSize: `${p.fontSize || 16}px`, lineHeight: (p.lineHeight as number) || 1.5, fontFamily: (p.fontFamily as string) || "inherit" }}>
                {p.text as string}
              </p>
            )}
          </div>
        );

      case "button":
        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px`, textAlign: (p.align as string) || "center" }}>
            <span style={{
              display: (p.fullWidth as boolean) ? "block" : "inline-block",
              backgroundColor: (p.backgroundColor as string) || "#2563eb",
              color: (p.color as string) || "#ffffff",
              padding: `${(p.buttonPadding as Record<string, number>)?.top ?? 12}px ${(p.buttonPadding as Record<string, number>)?.right ?? 24}px ${(p.buttonPadding as Record<string, number>)?.bottom ?? 12}px ${(p.buttonPadding as Record<string, number>)?.left ?? 24}px`,
              fontWeight: (p.fontWeight as string) || "600",
              fontSize: `${p.fontSize || 16}px`,
              borderRadius: `${p.borderRadius || 4}px`,
              fontFamily: (p.fontFamily as string) || "inherit",
              cursor: "default",
              textAlign: "center",
            } as React.CSSProperties}>
              {isSelected ? (
                <input
                  value={p.text as string}
                  onChange={(e) => updateProp("text", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="outline-none bg-transparent text-center w-auto"
                  style={{ color: "inherit", fontWeight: "inherit", fontSize: "inherit", fontFamily: "inherit" }}
                />
              ) : (p.text as string)}
            </span>
          </div>
        );

      case "image":
        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 0}px ${(p.padding as Record<string, number>)?.right ?? 0}px ${(p.padding as Record<string, number>)?.bottom ?? 0}px ${(p.padding as Record<string, number>)?.left ?? 0}px`, textAlign: (p.align as string) || "center" }}>
            <img src={p.url as string} alt={(p.alt as string) || ""} style={{ display: "block", maxWidth: "100%", width: (p.width as string) || "100%", height: "auto" }} />
          </div>
        );

      case "divider":
        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px` }}>
            <hr style={{ border: "none", borderTop: `${p.lineHeight || 1}px solid ${p.color || "#e5e7eb"}`, margin: 0 }} />
          </div>
        );

      case "spacer":
        return (
          <div style={{ height: `${p.height || 16}px` }}>
            {isSelected && (
              <div className="h-full flex items-center justify-center" style={{ background: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(59,130,246,0.05) 5px, rgba(59,130,246,0.05) 10px)" }}>
                <span className="text-xs text-blue-400 font-medium">{String(p.height)}px</span>
              </div>
            )}
          </div>
        );

      case "avatar":
        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px`, textAlign: (p.align as string) || "center" }}>
            <img src={p.src as string} alt={(p.alt as string) || ""} style={{ width: `${p.size || 64}px`, height: `${p.size || 64}px`, borderRadius: p.shape === "square" ? "4px" : "50%", display: "inline-block", objectFit: "cover" }} />
          </div>
        );

      case "columns": {
        const cols = p.columns as unknown[];
        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px` }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody><tr>
              {cols.map((_: unknown, i: number) => (
                <td key={i} style={{ width: `${100 / cols.length}%`, verticalAlign: "top", padding: i > 0 ? `0 0 0 ${p.gap || 16}px` : 0 }}>
                  <div className="min-h-[40px] border border-dashed border-gray-200 rounded p-2 text-xs text-gray-400 text-center">
                    Column {i + 1}
                  </div>
                </td>
              ))}
            </tr></tbody></table>
          </div>
        );
      }

      case "container":
        return (
          <div style={{
            padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px`,
            backgroundColor: (p.backgroundColor as string) || "transparent",
            border: p.borderColor ? `1px solid ${p.borderColor}` : "none",
            borderRadius: `${p.borderRadius || 0}px`,
          }}>
            <div className="min-h-[40px] border border-dashed border-gray-200 rounded p-2 text-xs text-gray-400 text-center">
              Container content
            </div>
          </div>
        );

      case "html": {
        const content = (p.content as string) || "";
        const isFullHtml = typeof content === "string" && (content.trim().toLowerCase().startsWith("<!doctype") || content.trim().toLowerCase().startsWith("<html"));

        const responsiveSrcDoc = isFullHtml
          ? content.replace(
              /(<head[^>]*>)/i,
              `$1<meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;overflow-x:hidden;width:100%!important;}table{max-width:100%!important;}img{max-width:100%!important;height:auto!important;}.email-container{width:100%!important;max-width:100%!important;}</style>`
            )
          : "";

        const handleIframeLoad = () => {
          const iframe = iframeRef.current;
          if (!iframe) return;
          try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc?.body) {
              doc.body.style.margin = "0";
              doc.body.style.overflowX = "hidden";
              doc.body.style.width = "100%";
              doc.querySelectorAll("table").forEach((t: Element) => {
                (t as HTMLElement).style.maxWidth = "100%";
              });
              doc.querySelectorAll("img").forEach((img: Element) => {
                (img as HTMLElement).style.maxWidth = "100%";
                (img as HTMLElement).style.height = "auto";
              });
              iframe.style.height = Math.max(100, doc.body.scrollHeight + 4) + "px";
            }
          } catch { /* cross-origin fallback */ }
        };

        if (isFullHtml) {
          return (
            <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 0}px ${(p.padding as Record<string, number>)?.right ?? 0}px ${(p.padding as Record<string, number>)?.bottom ?? 0}px ${(p.padding as Record<string, number>)?.left ?? 0}px`, overflow: "hidden" }}>
              <iframe
                ref={iframeRef}
                srcDoc={responsiveSrcDoc}
                sandbox="allow-same-origin"
                onLoad={handleIframeLoad}
                className="w-full border-0"
                style={{ minHeight: 200, display: "block", overflow: "hidden", width: "100%" }}
                title="HTML block preview"
              />
            </div>
          );
        }

        return (
          <div style={{ padding: `${(p.padding as Record<string, number>)?.top ?? 16}px ${(p.padding as Record<string, number>)?.right ?? 24}px ${(p.padding as Record<string, number>)?.bottom ?? 16}px ${(p.padding as Record<string, number>)?.left ?? 24}px`, textAlign: (p.textAlign as string) || "left", backgroundColor: (p.backgroundColor as string) || "transparent", overflow: "hidden", wordBreak: "break-word" }}>
            <div dangerouslySetInnerHTML={{ __html: content }} style={{ color: (p.color as string) || "inherit", fontSize: `${p.fontSize || 16}px`, fontFamily: (p.fontFamily as string) || "inherit", maxWidth: "100%", overflow: "hidden" } as React.CSSProperties} />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative group transition-all duration-100 cursor-pointer ${isSelected ? "outline outline-2 outline-blue-500 outline-offset-0" : "hover:outline hover:outline-1 hover:outline-blue-200 hover:outline-offset-0"}`}
      style={{ overflow: "hidden", maxWidth: "100%", wordBreak: "break-word", overflowWrap: "break-word" }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {renderContent()}

      {!isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete block"
          className="absolute top-1 right-1 w-6 h-6 rounded bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs font-bold shadow-sm hover:scale-110"
        >
          ✕
        </button>
      )}

      {isSelected && (
        <div
          className="absolute left-0 top-1/2 -translate-x-[calc(100%+8px)] -translate-y-1/2 flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {!isFirst && (
            <button onClick={onMoveUp} title="Move up" className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors border-b border-gray-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
          )}
          {!isLast && (
            <button onClick={onMoveDown} title="Move down" className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors border-b border-gray-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          )}
          <button onClick={onDuplicate} title="Duplicate" className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors border-b border-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button onClick={onDelete} title="Delete" className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};
