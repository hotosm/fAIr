import { useState } from "react";

/**
 * Custom hook to copy text to the clipboard and display a toast notification.
 *
 * @returns {Object} An object with:
 * - `isCopied`: A boolean indicating if the copy action was successful.
 * - `copyToClipboard`: A function to copy a given text to the clipboard and display a toast message.
 */
const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      setIsCopied(false);
    }
  };

  return { isCopied, copyToClipboard };
};

export default useCopyToClipboard;
