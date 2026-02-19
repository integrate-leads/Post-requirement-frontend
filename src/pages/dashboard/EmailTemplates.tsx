import React from "react";
import { EmailToolbox } from "@/email-templates";

/**
 * Email Templates page - embeds the email template kit (drag-and-drop editor)
 * for recruiters under Email Broadcast → Templates.
 */
const EmailTemplates: React.FC = () => {
  return (
    <div style={{ height: "calc(100vh - 108px)", minHeight: 600 }} className="flex flex-col">
      <EmailToolbox />
    </div>
  );
};

export default EmailTemplates;
