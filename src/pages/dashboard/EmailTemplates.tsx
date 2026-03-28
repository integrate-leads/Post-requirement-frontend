import React from "react";
import { Box } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { EmailToolbox } from "@/email-templates";

/**
 * Email Templates page - embeds the email template kit (drag-and-drop editor)
 * for recruiters under Email Broadcast → Templates.
 */
const EmailTemplates: React.FC = () => {
  const isSmall = useMediaQuery("(max-width: 48em)");
  const offsetPx = isSmall ? 84 : 108;

  return (
    <Box
      w="100%"
      maw="100%"
      className="flex flex-col"
      style={{
        height: `calc(100dvh - ${offsetPx}px)`,
        minHeight: isSmall ? 420 : 560,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <EmailToolbox />
    </Box>
  );
};

export default EmailTemplates;
