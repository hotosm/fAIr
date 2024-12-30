import { useState } from 'react';
import { useToastNotification } from './use-toast-notification';

/**
 * Custom hook to copy text to the clipboard and display a toast notification.
 *
 * @returns {Object} An object with:
 * - `isCopied`: A boolean indicating if the copy action was successful.
 * - `copyToClipboard`: A function to copy a given text to the clipboard and display a toast message.
 */
const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);
  const toast = useToastNotification();
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast("Copied to clipboard!", "success");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      setIsCopied(false);
      toast("Failed to copy!", "success");
    }
  };

  return { isCopied, copyToClipboard };
};

export default useCopyToClipboard;
