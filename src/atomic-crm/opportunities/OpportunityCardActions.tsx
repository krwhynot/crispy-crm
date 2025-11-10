import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdate, useDelete, useNotify, useRefresh } from "react-admin";

interface OpportunityCardActionsProps {
  opportunityId: number;
}

export function OpportunityCardActions({ opportunityId }: OpportunityCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const notify = useNotify();
  const refresh = useRefresh();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Always cleanup, even if component unmounts while closed
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opportunities/${opportunityId}/show`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opportunities/${opportunityId}`);
  };

  const handleMarkWon = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await update("opportunities", {
        id: opportunityId,
        data: { stage: "closed_won" },
        previousData: {},
      });
      notify("Opportunity marked as won", { type: "success" });
      refresh();
    } catch (error) {
      notify("Error updating opportunity", { type: "error" });
    }
    setIsOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this opportunity?")) {
      try {
        await deleteOne("opportunities", { id: opportunityId, previousData: {} });
        notify("Opportunity deleted", { type: "success" });
        refresh();
      } catch (error) {
        notify("Error deleting opportunity", { type: "error" });
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Actions menu"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag
        className="p-1 rounded hover:bg-muted transition-colors"
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={handleViewDetails}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              View Details
            </button>
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleMarkWon}
              className="w-full px-4 py-2 text-left text-sm text-success-strong hover:bg-accent transition-colors"
            >
              Mark as Won
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
