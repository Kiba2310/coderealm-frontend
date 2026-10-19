import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

interface AntiCheatOptions {
  enabled: boolean;
  onBlurWarning?: (count: number) => void;
  onFocusReturn?: (count: number) => void;
}

export const useAntiCheat = ({ enabled, onBlurWarning, onFocusReturn }: AntiCheatOptions) => {
  const [isBlurred, setIsBlurred] = useState(false);
  const blurCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // DevTools trap: constantly fires debugger. If DevTools is open, the page freezes.
    const devtoolsInterval = setInterval(() => {
      // eslint-disable-next-line no-debugger
      debugger;
    }, 1000);

    const handleFocus = () => {
      document.body.style.userSelect = 'auto';
      flushSync(() => {
        setIsBlurred(false);
      });
      if (onFocusReturn && blurCountRef.current > 0) {
        onFocusReturn(blurCountRef.current);
      }
    };

    const handleBlur = () => {
      document.body.style.userSelect = 'none';
      blurCountRef.current += 1;
      
      flushSync(() => {
        setIsBlurred(true);
      });
      if (onBlurWarning) {
        onBlurWarning(blurCountRef.current);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      // Optional: Add warning toast/alert here
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
      }
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('NICE TRY! SCREENSHOT BLOCKED.');
        handleBlur();
        setTimeout(handleFocus, 1000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('NICE TRY! SCREENSHOT BLOCKED.');
        handleBlur();
        setTimeout(handleFocus, 1000);
      }
    };

    // Attach event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      // Cleanup
      document.body.style.userSelect = 'auto';
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      clearInterval(devtoolsInterval);
    };
  }, [enabled, onBlurWarning, onFocusReturn]);

  return { isBlurred, blurCount: blurCountRef.current };
};
