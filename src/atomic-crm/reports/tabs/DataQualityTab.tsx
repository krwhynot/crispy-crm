/**
 * Data Quality Tab - Duplicate Contact Management
 *
 * Displays duplicate contacts and provides tools for merging them.
 * Uses the contact_duplicates database view for real-time monitoring.
 */

import { useState, useEffect, useCallback } from "react";
import { useDataProvider, useNotify, useRefresh } from "react-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle2, Loader2, Merge, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

interface DuplicateGroup {
  normalized_name: string;
  organization_id: number | null;
  organization_name: string | null;
  duplicate_count: number;
  contact_ids: number[];
  first_created: string;
  last_created: string;
  keeper_id: number;
  duplicate_ids: number[];
}

interface DuplicateStats {
  total_duplicate_groups: number;
  total_extra_records: number;
  high_priority_groups: number;
  medium_priority_groups: number;
}

interface ContactDetail {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: any;
  phone: any;
  organization_id: number | null;
  organization_name: string | null;
  created_at: string;
  interaction_count: number;
  task_count: number;
}

export default function DataQualityTab() {
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const [merging, setMerging] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load duplicate stats
      const { data: statsData, error: statsError } = await supabase
        .from("duplicate_stats")
        .select("*")
        .single();

      if (statsError && statsError.code !== "PGRST116") {
        console.error("Error loading stats:", statsError);
      } else if (statsData) {
        setStats(statsData);
      }

      // Load duplicate groups
      const { data: dupData, error: dupError } = await supabase
        .from("contact_duplicates")
        .select("*")
        .order("duplicate_count", { ascending: false })
        .limit(50);

      if (dupError) {
        console.error("Error loading duplicates:", dupError);
        notify("Failed to load duplicate data. View may not exist yet.", { type: "warning" });
      } else {
        setDuplicates(dupData || []);
      }
    } catch (err) {
      console.error("Error:", err);
      notify("Error loading data quality information", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadContactDetails = async (group: DuplicateGroup) => {
    setSelectedGroup(group);
    try {
      const { data, error } = await supabase.rpc("get_duplicate_details", {
        p_contact_ids: group.contact_ids,
      });

      if (error) {
        console.error("Error loading contact details:", error);
        notify("Failed to load contact details", { type: "error" });
        return;
      }

      setContactDetails(data || []);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleMerge = async () => {
    if (!selectedGroup) return;

    setMerging(true);
    try {
      const { data, error } = await supabase.rpc("merge_duplicate_contacts", {
        p_keeper_id: selectedGroup.keeper_id,
        p_duplicate_ids: selectedGroup.duplicate_ids,
      });

      if (error) {
        console.error("Merge error:", error);
        notify(`Merge failed: ${error.message}`, { type: "error" });
        return;
      }

      notify(
        `Successfully merged ${data.duplicates_removed} duplicates. Transferred ${data.interactions_transferred} interactions and ${data.tasks_transferred} tasks.`,
        { type: "success" }
      );

      setShowMergeDialog(false);
      setSelectedGroup(null);
      setContactDetails([]);
      loadData();
      refresh();
    } catch (err) {
      console.error("Error:", err);
      notify("An error occurred during merge", { type: "error" });
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicate Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_duplicate_groups ?? 0}</div>
            <p className="text-xs text-muted-foreground">Sets of duplicate contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extra Records</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.total_extra_records ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Redundant entries to remove</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.high_priority_groups ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Groups with 3+ duplicates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.medium_priority_groups ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Groups with 2 duplicates</p>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Duplicate Contacts</CardTitle>
              <CardDescription>
                Contacts with the same name at the same organization. Click to review and merge.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No duplicates found!</p>
              <p className="text-sm">Your contact database is clean.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-center">Duplicates</TableHead>
                  <TableHead>First Created</TableHead>
                  <TableHead>Last Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((group, idx) => (
                  <TableRow
                    key={`${group.normalized_name}-${group.organization_id}-${idx}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => loadContactDetails(group)}
                  >
                    <TableCell className="font-medium capitalize">
                      {group.normalized_name}
                    </TableCell>
                    <TableCell>{group.organization_name || "No Organization"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={group.duplicate_count >= 3 ? "destructive" : "secondary"}>
                        {group.duplicate_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(group.first_created).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(group.last_created).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadContactDetails(group);
                          setShowMergeDialog(true);
                        }}
                      >
                        <Merge className="h-4 w-4 mr-1" />
                        Merge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Selected Group Details */}
      {selectedGroup && contactDetails.length > 0 && !showMergeDialog && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">
              Details: {selectedGroup.normalized_name}
            </CardTitle>
            <CardDescription>
              Review contact details before merging. The oldest record (keeper) will be preserved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Interactions</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactDetails.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className={contact.id === selectedGroup.keeper_id ? "bg-green-50" : ""}
                  >
                    <TableCell>{contact.id}</TableCell>
                    <TableCell>
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {Array.isArray(contact.email)
                        ? contact.email[0]?.email || "-"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(contact.phone)
                        ? contact.phone[0]?.phone || "-"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(contact.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{contact.interaction_count}</TableCell>
                    <TableCell>{contact.task_count}</TableCell>
                    <TableCell>
                      {contact.id === selectedGroup.keeper_id ? (
                        <Badge variant="default" className="bg-green-600">
                          Keep
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Merge</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowMergeDialog(true)}>
                <Merge className="h-4 w-4 mr-2" />
                Merge {selectedGroup.duplicate_ids.length} Duplicates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Merge Confirmation Dialog */}
      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Merge</AlertDialogTitle>
            <AlertDialogDescription>
              This will merge {selectedGroup?.duplicate_ids.length ?? 0} duplicate contact(s) into
              the keeper record (ID: {selectedGroup?.keeper_id}).
              <br />
              <br />
              <strong>What happens:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All interactions will be transferred to the keeper</li>
                <li>All tasks will be transferred to the keeper</li>
                <li>Duplicate records will be permanently deleted</li>
              </ul>
              <br />
              <strong className="text-destructive">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={merging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMerge}
              disabled={merging}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="h-4 w-4 mr-2" />
                  Confirm Merge
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
