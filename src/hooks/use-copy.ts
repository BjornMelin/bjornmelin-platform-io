import { useState } from "react";

export const useCopy = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy text: ", error);
      setIsCopied(false);
    }
  };
  return { isCopied, copyToClipboard };
};
