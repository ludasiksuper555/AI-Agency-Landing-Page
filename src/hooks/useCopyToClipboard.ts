import { useState, useCallback } from 'react';

type CopyToClipboardResult = {
  isCopied: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  reset: () => void;
};

type CopyToClipboardOptions = {
  successDuration?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Custom hook for copying text to clipboard
 * @param options - Configuration options
 * @returns Object with copy function, copied state, and reset function
 */
export function useCopyToClipboard(
  options: CopyToClipboardOptions = {}
): CopyToClipboardResult {
  const {
    successDuration = 2000,
    onSuccess,
    onError,
  } = options;

  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) {
        return false;
      }

      try {
        // Modern approach using Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers or non-secure contexts
          await fallbackCopyToClipboard(text);
        }

        setIsCopied(true);
        onSuccess?.();

        // Reset copied state after specified duration
        if (successDuration > 0) {
          setTimeout(() => {
            setIsCopied(false);
          }, successDuration);
        }

        return true;
      } catch (error) {
        const copyError = error instanceof Error ? error : new Error('Failed to copy to clipboard');
        onError?.(copyError);
        setIsCopied(false);
        return false;
      }
    },
    [successDuration, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setIsCopied(false);
  }, []);

  return {
    isCopied,
    copyToClipboard,
    reset,
  };
}

/**
 * Fallback function for copying to clipboard in older browsers
 * @param text - Text to copy
 */
async function fallbackCopyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Make the textarea invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);

    try {
      // Select and copy the text
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices

      const successful = document.execCommand('copy');

      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand copy failed'));
      }
    } catch (error) {
      reject(error);
    } finally {
      // Clean up
      document.body.removeChild(textArea);
    }
  });
}

/**
 * Hook for copying with automatic feedback
 * @param text - Text to copy
 * @param options - Configuration options
 * @returns Object with copy function and feedback state
 */
export function useCopyWithFeedback(
  text: string,
  options: CopyToClipboardOptions = {}
) {
  const { isCopied, copyToClipboard } = useCopyToClipboard(options);

  const copy = useCallback(() => {
    return copyToClipboard(text);
  }, [text, copyToClipboard]);

  return {
    copy,
    isCopied,
    feedbackText: isCopied ? 'Copied!' : 'Copy',
  };
}

/**
 * Hook for copying formatted text (HTML, Markdown, etc.)
 * @param options - Configuration options
 * @returns Object with copy functions for different formats
 */
export function useCopyFormatted(
  options: CopyToClipboardOptions = {}
) {
  const { copyToClipboard, isCopied, reset } = useCopyToClipboard(options);

  const copyAsPlainText = useCallback(
    (text: string) => {
      return copyToClipboard(text);
    },
    [copyToClipboard]
  );

  const copyAsHTML = useCallback(
    async (html: string): Promise<boolean> => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          // Create ClipboardItem with HTML content
          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([stripHTML(html)], { type: 'text/plain' }),
          });

          await navigator.clipboard.write([clipboardItem]);
          return true;
        } else {
          // Fallback to plain text
          return copyToClipboard(stripHTML(html));
        }
      } catch (error) {
        // Fallback to plain text if HTML copy fails
        return copyToClipboard(stripHTML(html));
      }
    },
    [copyToClipboard]
  );

  const copyAsMarkdown = useCallback(
    (markdown: string) => {
      return copyToClipboard(markdown);
    },
    [copyToClipboard]
  );

  return {
    copyAsPlainText,
    copyAsHTML,
    copyAsMarkdown,
    isCopied,
    reset,
  };
}

/**
 * Utility function to strip HTML tags from text
 * @param html - HTML string
 * @returns Plain text
 */
function stripHTML(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Hook for copying code with syntax highlighting preservation
 * @param options - Configuration options
 * @returns Object with copy function for code
 */
export function useCopyCode(
  options: CopyToClipboardOptions = {}
) {
  const { copyToClipboard, isCopied, reset } = useCopyToClipboard(options);

  const copyCode = useCallback(
    (code: string, language?: string) => {
      // Add language comment if specified
      const codeWithLanguage = language
        ? `// Language: ${language}\n${code}`
        : code;

      return copyToClipboard(codeWithLanguage);
    },
    [copyToClipboard]
  );

  return {
    copyCode,
    isCopied,
    reset,
  };
}

/**
 * Check if clipboard API is supported
 * @returns Boolean indicating clipboard support
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard !== 'undefined' &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  ) || (
    typeof document !== 'undefined' &&
    typeof document.execCommand === 'function'
  );
}
