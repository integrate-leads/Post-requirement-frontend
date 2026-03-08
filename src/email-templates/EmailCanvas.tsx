import React from "react";
import { EmailBlock } from "./types";
import { EmailBlockRenderer } from "./EmailBlock";
import { BlockPickerInline } from "./BlockPickerInline";

interface Props {
  blocks: EmailBlock[];
  selectedId: string | null;
  globalStyles: { canvasColor: string; contentWidth: number; canvasBorderRadius: number; canvasBorderColor: string; backdropColor: string };
  onSelect: (id: string | null) => void;
  onUpdate: (b: EmailBlock) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onAddBlock: (block: EmailBlock, afterIndex?: number) => void;
  deviceMode: "desktop" | "mobile";
}

const AddButton: React.FC<{ onClick: (e: React.MouseEvent) => void; active?: boolean; first?: boolean }> = ({ onClick, active, first }) => (
  <div className={`flex justify-center ${first ? 'py-2' : 'py-1'} group/add relative`}>
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className={`w-7 h-7 rounded-full shadow text-sm flex items-center justify-center font-bold transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white scale-100 opacity-100"
          : "bg-blue-600 text-white opacity-0 group-hover/add:opacity-100 hover:scale-110"
      }`}
    >
      +
    </button>
    <div className={`absolute left-8 right-8 top-1/2 -translate-y-1/2 h-px transition-opacity duration-200 ${active ? 'bg-blue-300 opacity-100' : 'bg-transparent opacity-0 group-hover/add:bg-blue-200 group-hover/add:opacity-100'}`} />
  </div>
);

export const EmailCanvas: React.FC<Props> = ({
  blocks,
  selectedId,
  globalStyles,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onAddBlock,
  deviceMode,
}) => {
  const [showPickerAt, setShowPickerAt] = React.useState<number | null>(null);
  const canvasWidth = deviceMode === "mobile" ? 375 : globalStyles.contentWidth;

  const handleAddBlock = (block: EmailBlock) => {
    onAddBlock(block, showPickerAt ?? undefined);
    setShowPickerAt(null);
  };

  const togglePicker = (afterIndex: number) => {
    setShowPickerAt((prev) => (prev === afterIndex ? null : afterIndex));
  };

  return (
    <div
      className="flex-1 h-full overflow-y-auto flex justify-center py-0 px-0"
      style={{ backgroundColor: globalStyles.backdropColor }}
      onClick={() => { onSelect(null); setShowPickerAt(null); }}
    >
      <div style={{ width: canvasWidth, maxWidth: "100%", transition: "width 0.3s ease" }}>
        <div
          style={{
            backgroundColor: globalStyles.canvasColor,
            borderRadius: globalStyles.canvasBorderRadius,
            border: globalStyles.canvasBorderColor !== "transparent" ? `1px solid ${globalStyles.canvasBorderColor}` : "none",
            minHeight: 200,
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
          className="relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {blocks.length === 0 && showPickerAt === null && (
            <div className="flex flex-col items-center justify-center py-16">
              <button
                onClick={(e) => { e.stopPropagation(); togglePicker(-1); }}
                className="w-11 h-11 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl text-2xl flex items-center justify-center font-bold transition-all hover:scale-110"
              >
                +
              </button>
              <p className="text-sm text-gray-400 mt-3 font-medium">Add your first block</p>
            </div>
          )}

          {blocks.length === 0 && showPickerAt === -1 && (
            <BlockPickerInline onAdd={handleAddBlock} onClose={() => setShowPickerAt(null)} />
          )}

          {blocks.length > 0 && (
            <>
              <AddButton onClick={() => togglePicker(-1)} active={showPickerAt === -1} first />
              {showPickerAt === -1 && (
                <BlockPickerInline onAdd={handleAddBlock} onClose={() => setShowPickerAt(null)} />
              )}

              {blocks.map((block, idx) => (
                <React.Fragment key={block.id}>
                  <EmailBlockRenderer
                    block={block}
                    isSelected={selectedId === block.id}
                    onSelect={() => { onSelect(block.id); setShowPickerAt(null); }}
                    onUpdate={onUpdate}
                    onDelete={() => onDelete(block.id)}
                    onMoveUp={() => onMove(block.id, "up")}
                    onMoveDown={() => onMove(block.id, "down")}
                    onDuplicate={() => onDuplicate(block.id)}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                  />

                  <AddButton onClick={() => togglePicker(idx)} active={showPickerAt === idx} />
                  {showPickerAt === idx && (
                    <BlockPickerInline onAdd={handleAddBlock} onClose={() => setShowPickerAt(null)} />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
