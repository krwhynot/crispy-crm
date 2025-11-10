/**
 * Log Activity Step Component
 *
 * Step 1 of Quick Complete Task workflow.
 * Captures activity details with intelligent defaults.
 *
 * Features:
 * - Auto-detects activity type from task title
 * - Pre-fills notes with task description
 * - Validates required fields
 * - Keyboard shortcuts (Enter to save, Esc to skip)
 */

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { inferActivityTypeFromTaskTitle } from "./utils/activityTypeDetection";
import type { Task } from "../types";

interface LogActivityStepProps {
  task: Task;
  onSave: (activityData: ActivityData) => void;
  onSkip: () => void;
}

export interface ActivityData {
  type: string; // interaction_type enum value
  description: string;
  subject?: string;
  activity_date?: string;
}

// Activity type choices for the select dropdown
// These map to the interaction_type enum in the database
const ACTIVITY_TYPE_CHOICES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "demo", label: "Demo" },
  { value: "proposal", label: "Proposal" },
  { value: "follow_up", label: "Follow-up" },
  { value: "trade_show", label: "Trade Show" },
  { value: "site_visit", label: "Site Visit" },
  { value: "contract_review", label: "Contract Review" },
  { value: "check_in", label: "Check-in" },
  { value: "social", label: "Social" },
];

export function LogActivityStep({ task, onSave, onSkip }: LogActivityStepProps) {
  // Auto-detect activity type from task title
  const detectedType = inferActivityTypeFromTaskTitle(task.title);

  // Form state
  const [activityType, setActivityType] = useState<string>(detectedType);
  const [notes, setNotes] = useState<string>(task.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-focus notes field
  const notesRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    notesRef.current?.focus();
  }, []);

  // Validation
  const isValid = notes.trim().length > 0;

  // Handle save
  const handleSave = async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    const activityData: ActivityData = {
      type: activityType,
      description: notes.trim(),
      subject: task.title, // Use task title as activity subject
      activity_date: new Date().toISOString(), // Current timestamp
    };

    onSave(activityData);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (isValid) {
          handleSave();
        }
      }
      // Escape to skip
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isValid, notes, activityType]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Activity Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="activity-type">Activity Type</Label>
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger id="activity-type">
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPE_CHOICES.map((choice) => (
              <SelectItem key={choice.value} value={choice.value}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {detectedType && (
          <p className="text-xs text-muted-foreground">
            ( Auto-detected from task title
          </p>
        )}
      </div>

      {/* Notes Textarea */}
      <div className="space-y-2">
        <Label htmlFor="activity-notes">
          Notes <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="activity-notes"
          ref={notesRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened? (e.g., 'Discussed pricing options, customer interested in 2 cases')"
          rows={4}
          disabled={isSubmitting}
          aria-invalid={notes.trim().length === 0}
        />
        <p className="text-xs text-muted-foreground">
          {notes.trim().length === 0
            ? "Activity notes are required"
            : `${notes.trim().length} characters`}
        </p>
      </div>

      {/* Context Display */}
      <div className="rounded-md bg-muted/50 p-3 text-sm">
        <p className="font-medium text-foreground">Related to:</p>
        <ul className="mt-1 space-y-1 text-muted-foreground">
          <li>=Ë Task: {task.title}</li>
          {task.opportunity_id && (
            <li>=¼ Opportunity (ID: {task.opportunity_id})</li>
          )}
          {task.contact_id && <li>=d Contact (ID: {task.contact_id})</li>}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1"
        >
          Skip
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isValid || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Saving..." : "Save & Continue ’"}
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <p className="text-center text-xs text-muted-foreground">
        <kbd className="rounded bg-muted px-1.5 py-0.5">Ctrl+Enter</kbd> to save
        " <kbd className="rounded bg-muted px-1.5 py-0.5">Esc</kbd> to skip
      </p>
    </div>
  );
}
