export type BlockType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "avatar"
  | "columns"
  | "container"
  | "html";

export interface EmailBlock {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
}

export interface GlobalStyles {
  backdropColor: string;
  canvasColor: string;
  canvasBorderColor: string;
  canvasBorderRadius: number;
  fontFamily: string;
  textColor: string;
  contentWidth: number;
}

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  backdropColor: "#f3f3f5",
  canvasColor: "#ffffff",
  canvasBorderColor: "transparent",
  canvasBorderRadius: 0,
  fontFamily: "Arial, Helvetica, sans-serif",
  textColor: "#1e293b",
  contentWidth: 600,
};

export const BLOCK_META: Record<BlockType, { label: string; icon: string }> = {
  heading:   { label: "Heading",   icon: "H" },
  text:      { label: "Text",      icon: "≡" },
  button:    { label: "Button",    icon: "⊡" },
  image:     { label: "Image",     icon: "▣" },
  avatar:    { label: "Avatar",    icon: "◎" },
  divider:   { label: "Divider",   icon: "—" },
  spacer:    { label: "Spacer",    icon: "□" },
  html:      { label: "Html",      icon: "HTML" },
  columns:   { label: "Columns",   icon: "⊞" },
  container: { label: "Container", icon: "⊡" },
};

// The order in the picker grid (4 per row as in reference)
export const BLOCK_PICKER_ORDER: BlockType[] = [
  "heading", "text", "button", "image",
  "avatar", "divider", "spacer", "html",
  "columns", "container",
];

export const DEFAULT_BLOCK_PROPS: Record<BlockType, Record<string, unknown>> = {
  heading: {
    text: "Heading",
    level: "h2",
    color: "",
    backgroundColor: "",
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "",
    textAlign: "left",
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
  },
  text: {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    color: "",
    backgroundColor: "",
    fontSize: 16,
    fontFamily: "",
    lineHeight: 1.5,
    textAlign: "left",
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
  },
  button: {
    text: "Button",
    url: "https://example.com",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "",
    borderRadius: 4,
    align: "center",
    fullWidth: false,
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    buttonPadding: { top: 12, bottom: 12, left: 24, right: 24 },
  },
  image: {
    url: "https://placehold.co/600x200/e2e8f0/94a3b8?text=Image",
    alt: "Image",
    linkUrl: "",
    width: "100%",
    align: "center",
    contentAlignment: "middle",
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  divider: {
    color: "#e5e7eb",
    lineHeight: 1,
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
  },
  spacer: {
    height: 16,
  },
  avatar: {
    src: "https://placehold.co/64x64/e2e8f0/94a3b8?text=AV",
    alt: "Avatar",
    size: 64,
    shape: "circle",
    align: "center",
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
  },
  columns: {
    count: 2,
    columns: [
      { children: [] },
      { children: [] },
    ],
    gap: 16,
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
  },
  container: {
    backgroundColor: "",
    borderColor: "#e5e7eb",
    borderRadius: 0,
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    children: [],
  },
  html: {
    content: "<strong>Hello world</strong>",
    color: "",
    backgroundColor: "",
    fontSize: 16,
    fontFamily: "",
    textAlign: "left",
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
  },
};
