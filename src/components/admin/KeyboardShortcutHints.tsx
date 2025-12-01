import { Keyboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

/**
 * Detect if running on Mac for displaying correct modifier key
 */
const isMac = () => {
  return typeof window !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
};

interface ShortcutItem {
  keys: string[];
  description: string;
}

/**
 * KeyboardShortcutHints - Displays available keyboard shortcuts in a tooltip
 *
 * Shows a keyboard icon button that reveals available shortcuts on hover.
 * Automatically detects Mac vs Windows for correct modifier key display.
 */
export function KeyboardShortcutHints() {
  const mod = isMac() ? "⌘" : "Ctrl";

  const shortcuts: ShortcutItem[] = [
    { keys: [mod, "N"], description: "New record" },
    { keys: [mod, "K"], description: "Focus search" },
    { keys: ["/"], description: "Focus search" },
    { keys: ["↑", "↓"], description: "Navigate list" },
    { keys: ["Enter"], description: "Open selected" },
    { keys: ["Esc"], description: "Close / Cancel" },
    { keys: [mod, "S"], description: "Save (in form)" },
  ];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-muted-foreground hover:text-foreground"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-56 p-3" sideOffset={8}>
        <p className="font-medium text-sm mb-2">Keyboard Shortcuts</p>
        <div className="space-y-1.5">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd key={j} className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Inline keyboard shortcut hint for buttons/actions
 * Example: "New Contact ⌘N"
 */
export function InlineShortcutHint({ shortcut }: { shortcut: string }) {
  return (
    <kbd className="ml-2 px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-mono text-muted-foreground">
      {shortcut}
    </kbd>
  );
}
