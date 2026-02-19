import React from "react";
import { BlockType, BLOCK_META, BLOCK_PICKER_ORDER, DEFAULT_BLOCK_PROPS, EmailBlock } from "./types";

function makeBlock(type: BlockType): EmailBlock {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    props: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPS[type])),
  };
}

interface Props {
  onAdd: (block: EmailBlock) => void;
  onClose: () => void;
}

export const BlockPickerInline: React.FC<Props> = ({ onAdd, onClose }) => {
  return (
    <div className="py-4 px-6 flex justify-center" onClick={(e) => e.stopPropagation()} style={{ animation: "fadeInUp 0.15s ease-out" }}>
      <div className="bg-card rounded-lg shadow-xl border border-border p-4 w-full max-w-md">
        <div className="grid grid-cols-4 gap-2">
          {BLOCK_PICKER_ORDER.map((type) => {
            const meta = BLOCK_META[type];
            return (
              <button
                key={type}
                onClick={() => { onAdd(makeBlock(type)); onClose(); }}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all duration-150 group bg-card"
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-md border border-border group-hover:border-primary bg-background text-muted-foreground group-hover:text-primary transition-all duration-150">
                  <span className="text-sm font-bold font-mono leading-none select-none">{meta.icon}</span>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium transition-colors">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
