import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
  mac?: string[]; // Alternative keys for Mac
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const isMac = () => {
  return typeof window !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
};

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      {
        keys: ["Ctrl", "K"],
        mac: ["⌘", "K"],
        description: "Focus search bar",
      },
      {
        keys: ["/"],
        description: "Focus search bar (alternative)",
      },
      {
        keys: ["Ctrl", "N"],
        mac: ["⌘", "N"],
        description: "Create new record",
      },
      {
        keys: ["Esc"],
        description: "Close modal or cancel",
      },
    ],
  },
  {
    title: "Forms",
    shortcuts: [
      {
        keys: ["Ctrl", "S"],
        mac: ["⌘", "S"],
        description: "Save form",
      },
      {
        keys: ["Enter"],
        description: "Submit form",
      },
      {
        keys: ["Tab"],
        description: "Move to next field",
      },
      {
        keys: ["Shift", "Tab"],
        description: "Move to previous field",
      },
    ],
  },
  {
    title: "Lists",
    shortcuts: [
      {
        keys: ["↑", "↓"],
        description: "Navigate list items",
      },
      {
        keys: ["Space"],
        description: "Select item for bulk actions",
      },
      {
        keys: ["Delete"],
        description: "Delete selected items",
      },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsModal = ({ open, onOpenChange }: KeyboardShortcutsModalProps) => {
  const platform = React.useMemo(() => isMac(), []);

  const getShortcutKeys = (shortcut: Shortcut): string[] => {
    if (platform && shortcut.mac) {
      return shortcut.mac;
    }
    return shortcut.keys;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the CRM more efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getShortcutKeys(shortcut).map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-muted-foreground text-xs mx-0.5">+</span>
                          )}
                          <kbd className="pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>
            Tip: Most shortcuts are context-aware and will only work when appropriate. For example,{" "}
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Ctrl+S</kbd> only works when
            editing a form.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
