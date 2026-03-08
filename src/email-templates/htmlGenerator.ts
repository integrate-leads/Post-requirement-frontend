import { EmailBlock, GlobalStyles } from "./types";

function isFullDocument(html: string): boolean {
  const t = html.trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

export function generateEmailHtml(blocks: EmailBlock[], global: GlobalStyles): string {
  // If the only content is a single full-document HTML block, use it as-is (e.g. after "Apply HTML").
  if (blocks.length === 1 && blocks[0].type === "html") {
    const content = String((blocks[0].props as Record<string, unknown>).content || "");
    if (isFullDocument(content)) return content;
  }

  const bodyRows = blocks.map(renderBlock).join("\n");
  const { canvasColor, backdropColor, fontFamily, textColor, contentWidth, canvasBorderRadius, canvasBorderColor } = global;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${backdropColor}; font-family: ${fontFamily}; color: ${textColor}; }
    table { border-collapse: collapse; }
    @media only screen and (max-width: 600px) { .email-container { width: 100% !important; } }
  </style>
</head>
<body style="background-color:${backdropColor};margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${backdropColor};">
    <tr>
      <td align="center" style="padding:0;">
        <table class="email-container" width="${contentWidth}" cellpadding="0" cellspacing="0" border="0"
          style="max-width:${contentWidth}px;width:100%;background-color:${canvasColor};border-radius:${canvasBorderRadius}px;${canvasBorderColor !== 'transparent' ? `border:1px solid ${canvasBorderColor};` : ''}overflow:hidden;">
${bodyRows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function pad(p: Record<string, number> | undefined, def = 16): string {
  if (!p) return `${def}px`;
  return `${p.top ?? def}px ${p.right ?? def}px ${p.bottom ?? def}px ${p.left ?? def}px`;
}

function renderBlock(block: EmailBlock): string {
  const { type, props: p } = block;
  const pr = p as Record<string, unknown>;

  switch (type) {
    case "heading":
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};text-align:${pr.textAlign || 'left'};${pr.backgroundColor ? `background-color:${pr.backgroundColor};` : ''}">
            <${pr.level || 'h2'} style="margin:0;color:${pr.color || 'inherit'};font-size:${pr.fontSize || 32}px;font-weight:${pr.fontWeight || 'bold'};font-family:${pr.fontFamily || 'inherit'};">${pr.text}</${pr.level || 'h2'}>
          </td></tr>`;

    case "text":
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};text-align:${pr.textAlign || 'left'};${pr.backgroundColor ? `background-color:${pr.backgroundColor};` : ''}">
            <p style="margin:0;color:${pr.color || 'inherit'};font-size:${pr.fontSize || 16}px;line-height:${pr.lineHeight || 1.5};font-family:${pr.fontFamily || 'inherit'};">${(pr.text as string).replace(/\n/g, '<br/>')}</p>
          </td></tr>`;

    case "button": {
      const bp = (pr.buttonPadding || { top: 12, bottom: 12, left: 24, right: 24 }) as Record<string, number>;
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};text-align:${pr.align || 'center'};">
            <a href="${pr.url || '#'}" style="display:${pr.fullWidth ? 'block' : 'inline-block'};background-color:${pr.backgroundColor || '#2563eb'};color:${pr.color || '#ffffff'};padding:${bp.top}px ${bp.right}px ${bp.bottom}px ${bp.left}px;text-decoration:none;font-weight:${pr.fontWeight || '600'};font-size:${pr.fontSize || 16}px;border-radius:${pr.borderRadius || 4}px;font-family:${pr.fontFamily || 'inherit'};text-align:center;">${pr.text}</a>
          </td></tr>`;
    }

    case "image": {
      const img = `<img src="${pr.url}" alt="${pr.alt || ''}" style="display:block;max-width:100%;width:${pr.width || '100%'};height:auto;" />`;
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>, 0)};text-align:${pr.align || 'center'};">${pr.linkUrl ? `<a href="${pr.linkUrl}">${img}</a>` : img}</td></tr>`;
    }

    case "divider":
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};"><hr style="border:none;border-top:${pr.lineHeight || 1}px solid ${pr.color || '#e5e7eb'};margin:0;" /></td></tr>`;

    case "spacer":
      return `          <tr><td style="height:${pr.height || 16}px;line-height:${pr.height || 16}px;font-size:1px;">&nbsp;</td></tr>`;

    case "avatar": {
      const sz = pr.size || 64;
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};text-align:${pr.align || 'center'};">
            <img src="${pr.src}" alt="${pr.alt || ''}" width="${sz}" height="${sz}" style="border-radius:${pr.shape === 'square' ? '4px' : '50%'};display:inline-block;" />
          </td></tr>`;
    }

    case "columns": {
      const cols = pr.columns as unknown[];
      const colW = Math.floor(100 / cols.length);
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${cols.map((_: unknown, i: number) => `              <td width="${colW}%" style="vertical-align:top;${i > 0 ? `padding-left:${pr.gap || 16}px;` : ''}"></td>`).join('\n')}
            </tr></table>
          </td></tr>`;
    }

    case "container":
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};${pr.backgroundColor ? `background-color:${pr.backgroundColor};` : ''}${pr.borderColor ? `border:1px solid ${pr.borderColor};` : ''}border-radius:${pr.borderRadius || 0}px;"></td></tr>`;

    case "html":
      return `          <tr><td style="padding:${pad(pr.padding as Record<string, number>)};text-align:${pr.textAlign || 'left'};${pr.backgroundColor ? `background-color:${pr.backgroundColor};` : ''}color:${pr.color || 'inherit'};font-size:${pr.fontSize || 16}px;font-family:${pr.fontFamily || 'inherit'};">${pr.content}</td></tr>`;

    default:
      return "";
  }
}
