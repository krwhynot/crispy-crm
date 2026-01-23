/**
 * Workflow Management Section Component
 *
 * Displays and enables inline editing for opportunity workflow fields:
 * - Tags (clickable chips that filter opportunities list)
 * - Next Action (inline editable text field)
 * - Next Action Date (inline editable date picker with overdue highlighting)
 * - Decision Criteria (expandable text area)
 *
 * All fields save automatically on blur.
 */

import * as React from "react";
import { useState } from "react";
import { useShowContext, useUpdate, useNotify } from "ra-core";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { opportunityKeys } from "../queryKeys";
import { format, isValid, isPast, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AdminButton } from "@/components/admin/AdminButton";
import { Input } from "@/components/ui/input";
import { ControlledDatePicker } from "@/components/ra-wrappers/controlled-date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, ChevronDown, ChevronUp, Tag as TagIcon, Target, FileText } from "lucide-react";
import type { Opportunity } from "../types";

export const WorkflowManagementSection: React.FC = () => {
  const { record } = useShowContext<Opportunity>();
  const [update] = useUpdate();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local state for inline editing (use ?? null to preserve NULL vs empty string distinction)
  const [nextAction, setNextAction] = useState<string | null>(record?.next_action ?? null);
  const [nextActionDate, setNextActionDate] = useState<string | null>(
    record?.next_action_date ?? null
  );
  const [decisionCriteria, setDecisionCriteria] = useState<string | null>(
    record?.decision_criteria ?? null
  );
  const [newTag, setNewTag] = useState("");
  const [isDecisionCriteriaOpen, setIsDecisionCriteriaOpen] = useState(false);

  // Sync local state when record changes (use ?? null to preserve NULL vs empty string distinction)
  React.useEffect(() => {
    if (record) {
      setNextAction(record.next_action ?? null);
      setNextActionDate(record.next_action_date ?? null);
      setDecisionCriteria(record.decision_criteria ?? null);
    }
  }, [record]);

  if (!record) return null;

  const handleSaveField = (field: keyof Opportunity, value: string | string[] | null) => {
    update(
      "opportunities",
      {
        id: record.id,
        data: { [field]: value },
        previousData: record,
      },
      {
        onSuccess: () => {
          // Invalidate all opportunity queries to ensure UI consistency
          queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
          notify(`${field.replace(/_/g, " ")} updated`, { type: "info" });
        },
        onError: () => {
          notify(`Error updating ${field.replace(/_/g, " ")}`, { type: "error" });
        },
      }
    );
  };

  const handleNextActionBlur = () => {
    if (nextAction !== record.next_action) {
      handleSaveField("next_action", nextAction || null);
    }
  };

  const handleNextActionDateBlur = () => {
    if (nextActionDate !== record.next_action_date) {
      handleSaveField("next_action_date", nextActionDate || null);
    }
  };

  const handleDecisionCriteriaBlur = () => {
    if (decisionCriteria !== record.decision_criteria) {
      handleSaveField("decision_criteria", decisionCriteria || null);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const currentTags = record.tags || [];
    if (currentTags.includes(newTag.trim())) {
      notify("Tag already exists", { type: "warning" });
      return;
    }
    const updatedTags = [...currentTags, newTag.trim()];
    handleSaveField("tags", updatedTags);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (record.tags || []).filter((tag) => tag !== tagToRemove);
    handleSaveField("tags", updatedTags);
  };

  const handleTagClick = (tag: string) => {
    // Navigate to opportunities list with tag filter
    navigate(`/opportunities?filter=${encodeURIComponent(JSON.stringify({ tags: [tag] }))}`);
  };

  const isNextActionOverdue =
    nextActionDate && isValid(parseISO(nextActionDate)) && isPast(parseISO(nextActionDate));

  return (
    <Card className="bg-muted/30 border border-border">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Workflow Management
        </h3>

        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
            <TagIcon className="w-3.5 h-3.5" />
            <span>Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {record.tags && record.tags.length > 0 ? (
              record.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag);
                    }}
                    className="ml-1 text-xs hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No tags</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTag();
                }
              }}
              placeholder="Add tag..."
              className="text-sm"
            />
            <AdminButton onClick={handleAddTag} size="sm" variant="outline" className="h-11">
              Add
            </AdminButton>
          </div>
        </div>

        {/* Next Action Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
            <Target className="w-3.5 h-3.5" />
            <span>Next Action</span>
          </div>
          <Input
            value={nextAction ?? ""}
            onChange={(e) => setNextAction(e.target.value || null)}
            onBlur={handleNextActionBlur}
            placeholder="What needs to happen next?"
            className="text-sm"
          />
        </div>

        {/* Next Action Date Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
            <Calendar className="w-3.5 h-3.5" />
            <span>Next Action Date</span>
            {isNextActionOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
          <ControlledDatePicker
            value={nextActionDate ?? ""}
            onChange={(date) => setNextActionDate(date || null)}
            onBlur={handleNextActionDateBlur}
            clearable
            className={isNextActionOverdue ? "border-destructive" : ""}
          />
        </div>

        {/* Decision Criteria Section (Collapsible) */}
        <Collapsible open={isDecisionCriteriaOpen} onOpenChange={setIsDecisionCriteriaOpen}>
          <div className="space-y-2">
            <CollapsibleTrigger asChild>
              <AdminButton
                variant="ghost"
                className="w-full justify-between p-0 h-auto hover:bg-transparent"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Decision Criteria</span>
                </div>
                {isDecisionCriteriaOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </AdminButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Textarea
                value={decisionCriteria ?? ""}
                onChange={(e) => setDecisionCriteria(e.target.value || null)}
                onBlur={handleDecisionCriteriaBlur}
                placeholder="What criteria will determine whether this opportunity closes?"
                className="min-h-[100px] text-sm"
              />
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
