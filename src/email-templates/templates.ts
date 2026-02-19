import { EmailBlock, GlobalStyles } from "./types";

export interface EmailTemplate {
  id: string;
  label: string;
  globalStyles: GlobalStyles;
  blocks: EmailBlock[];
}

const defaultGlobal: GlobalStyles = {
  backdropColor: "#f3f3f5",
  canvasColor: "#ffffff",
  canvasBorderColor: "transparent",
  canvasBorderRadius: 0,
  fontFamily: "Arial, Helvetica, sans-serif",
  textColor: "#1e293b",
  contentWidth: 600,
};

export const TEMPLATES: EmailTemplate[] = [
  {
    id: "empty",
    label: "Empty",
    globalStyles: defaultGlobal,
    blocks: [],
  },
  {
    id: "welcome",
    label: "Welcome email",
    globalStyles: { ...defaultGlobal },
    blocks: [
      { id: "w1", type: "image", props: { url: "https://placehold.co/600x120/2563eb/ffffff?text=YourBrand", alt: "Brand logo", linkUrl: "", width: "100%", align: "center", contentAlignment: "middle", padding: { top: 0, bottom: 0, left: 0, right: 0 } } },
      { id: "w2", type: "heading", props: { text: "Welcome aboard! 🎉", level: "h1", color: "#1e293b", backgroundColor: "", fontSize: 30, fontWeight: "bold", fontFamily: "", textAlign: "center", padding: { top: 32, bottom: 8, left: 24, right: 24 } } },
      { id: "w3", type: "text", props: { text: "We're so excited to have you join us. Your account is ready and you can start exploring right away.", color: "#475569", backgroundColor: "", fontSize: 16, fontFamily: "", lineHeight: 1.7, textAlign: "center", padding: { top: 8, bottom: 16, left: 32, right: 32 } } },
      { id: "w4", type: "button", props: { text: "Get Started →", url: "https://example.com", backgroundColor: "#2563eb", color: "#ffffff", fontSize: 15, fontWeight: "bold", fontFamily: "", borderRadius: 8, align: "center", fullWidth: false, padding: { top: 8, bottom: 32, left: 24, right: 24 }, buttonPadding: { top: 14, bottom: 14, left: 32, right: 32 } } },
      { id: "w5", type: "divider", props: { color: "#e2e8f0", lineHeight: 1, padding: { top: 0, bottom: 0, left: 24, right: 24 } } },
      { id: "w6", type: "text", props: { text: "If you have any questions, just reply to this email — we're always happy to help.", color: "#94a3b8", backgroundColor: "", fontSize: 13, fontFamily: "", lineHeight: 1.6, textAlign: "center", padding: { top: 24, bottom: 24, left: 32, right: 32 } } },
    ],
  },
  {
    id: "otp",
    label: "One-time passcode (OTP)",
    globalStyles: { ...defaultGlobal },
    blocks: [
      { id: "o1", type: "heading", props: { text: "Your verification code", level: "h1", color: "#1e293b", backgroundColor: "", fontSize: 26, fontWeight: "bold", fontFamily: "", textAlign: "center", padding: { top: 40, bottom: 8, left: 24, right: 24 } } },
      { id: "o2", type: "text", props: { text: "Use the code below to verify your identity. This code will expire in 10 minutes.", color: "#475569", backgroundColor: "", fontSize: 15, fontFamily: "", lineHeight: 1.7, textAlign: "center", padding: { top: 0, bottom: 24, left: 32, right: 32 } } },
      { id: "o3", type: "html", props: { content: `<div style="text-align:center;padding:16px 24px;"><div style="display:inline-block;background:#f0f4ff;border:2px solid #2563eb;border-radius:12px;padding:20px 48px;"><span style="font-family:monospace;font-size:40px;font-weight:900;color:#2563eb;letter-spacing:12px;">482930</span></div></div>`, color: "", backgroundColor: "", fontSize: 16, fontFamily: "", textAlign: "center", padding: { top: 0, bottom: 0, left: 0, right: 0 } } },
      { id: "o4", type: "text", props: { text: "If you didn't request this code, you can safely ignore this email.", color: "#94a3b8", backgroundColor: "", fontSize: 13, fontFamily: "", lineHeight: 1.6, textAlign: "center", padding: { top: 24, bottom: 40, left: 32, right: 32 } } },
    ],
  },
  {
    id: "reset-password",
    label: "Reset password",
    globalStyles: { ...defaultGlobal },
    blocks: [
      { id: "r1", type: "heading", props: { text: "Reset your password", level: "h1", color: "#1e293b", backgroundColor: "", fontSize: 28, fontWeight: "bold", fontFamily: "", textAlign: "center", padding: { top: 40, bottom: 8, left: 24, right: 24 } } },
      { id: "r2", type: "text", props: { text: "We received a request to reset your password. Click the button below to choose a new password.", color: "#475569", backgroundColor: "", fontSize: 15, fontFamily: "", lineHeight: 1.7, textAlign: "center", padding: { top: 8, bottom: 16, left: 32, right: 32 } } },
      { id: "r3", type: "button", props: { text: "Reset Password", url: "https://example.com/reset", backgroundColor: "#dc2626", color: "#ffffff", fontSize: 15, fontWeight: "bold", fontFamily: "", borderRadius: 6, align: "center", fullWidth: false, padding: { top: 8, bottom: 8, left: 24, right: 24 }, buttonPadding: { top: 13, bottom: 13, left: 28, right: 28 } } },
      { id: "r4", type: "text", props: { text: "This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.", color: "#94a3b8", backgroundColor: "", fontSize: 13, fontFamily: "", lineHeight: 1.6, textAlign: "center", padding: { top: 24, bottom: 40, left: 32, right: 32 } } },
    ],
  },
  {
    id: "receipt",
    label: "E-commerce receipt",
    globalStyles: { ...defaultGlobal },
    blocks: [
      { id: "e1", type: "heading", props: { text: "Order Confirmed ✓", level: "h1", color: "#16a34a", backgroundColor: "", fontSize: 26, fontWeight: "bold", fontFamily: "", textAlign: "center", padding: { top: 36, bottom: 4, left: 24, right: 24 } } },
      { id: "e2", type: "text", props: { text: "Thank you for your purchase! Your order #ORD-20489 has been confirmed.", color: "#374151", backgroundColor: "", fontSize: 15, fontFamily: "", lineHeight: 1.7, textAlign: "center", padding: { top: 4, bottom: 20, left: 32, right: 32 } } },
      { id: "e3", type: "divider", props: { color: "#e5e7eb", lineHeight: 1, padding: { top: 0, bottom: 0, left: 24, right: 24 } } },
      { id: "e4", type: "html", props: { content: `<table style="width:100%;border-collapse:collapse;font-family:Arial;"><tr style="background:#f9fafb;"><td style="padding:12px 24px;font-size:13px;color:#6b7280;">ITEM</td><td style="padding:12px 24px;font-size:13px;color:#6b7280;text-align:right;">PRICE</td></tr><tr><td style="padding:12px 24px;font-size:14px;color:#111827;border-top:1px solid #f3f4f6;">Product × 1</td><td style="padding:12px 24px;font-size:14px;color:#111827;text-align:right;border-top:1px solid #f3f4f6;">$49.00</td></tr><tr style="background:#f9fafb;"><td style="padding:12px 24px;font-size:15px;font-weight:bold;color:#111827;">Total</td><td style="padding:12px 24px;font-size:15px;font-weight:bold;color:#111827;text-align:right;">$49.00</td></tr></table>`, color: "", backgroundColor: "", fontSize: 16, fontFamily: "", textAlign: "left", padding: { top: 0, bottom: 0, left: 0, right: 0 } } },
      { id: "e5", type: "button", props: { text: "Track Your Order", url: "#", backgroundColor: "#111827", color: "#ffffff", fontSize: 14, fontWeight: "bold", fontFamily: "", borderRadius: 6, align: "center", fullWidth: false, padding: { top: 24, bottom: 32, left: 24, right: 24 }, buttonPadding: { top: 12, bottom: 12, left: 24, right: 24 } } },
    ],
  },
  {
    id: "subscription",
    label: "Subscription receipt",
    globalStyles: { ...defaultGlobal },
    blocks: [
      { id: "s1", type: "heading", props: { text: "Payment Successful 💳", level: "h1", color: "#1e293b", backgroundColor: "", fontSize: 26, fontWeight: "bold", fontFamily: "", textAlign: "center", padding: { top: 36, bottom: 4, left: 24, right: 24 } } },
      { id: "s2", type: "text", props: { text: "Your subscription has been renewed. Here's a summary of your billing.", color: "#475569", backgroundColor: "", fontSize: 15, fontFamily: "", lineHeight: 1.7, textAlign: "center", padding: { top: 4, bottom: 20, left: 32, right: 32 } } },
      { id: "s3", type: "html", props: { content: `<table style="width:100%;font-family:Arial;"><tr><td style="padding:10px 24px;font-size:14px;color:#374151;">Plan</td><td style="padding:10px 24px;font-size:14px;color:#111827;font-weight:600;text-align:right;">Pro Monthly</td></tr><tr style="background:#f9fafb;"><td style="padding:10px 24px;font-size:14px;color:#374151;">Amount</td><td style="padding:10px 24px;font-size:14px;color:#111827;font-weight:600;text-align:right;">$29.00</td></tr></table>`, color: "", backgroundColor: "", fontSize: 16, fontFamily: "", textAlign: "left", padding: { top: 0, bottom: 0, left: 0, right: 0 } } },
      { id: "s4", type: "button", props: { text: "Manage Subscription", url: "#", backgroundColor: "#7c3aed", color: "#ffffff", fontSize: 14, fontWeight: "bold", fontFamily: "", borderRadius: 6, align: "center", fullWidth: false, padding: { top: 24, bottom: 32, left: 24, right: 24 }, buttonPadding: { top: 12, bottom: 12, left: 24, right: 24 } } },
    ],
  },
];
