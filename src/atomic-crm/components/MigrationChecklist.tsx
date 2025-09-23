import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Users,
  Building,
  Briefcase,
  Activity,
  Search,
  Eye,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: "data" | "functionality" | "ui" | "performance";
  priority: "critical" | "important" | "optional";
  action?: string;
  link?: string;
  autoVerified?: boolean;
  verified?: boolean;
}

interface MigrationChecklistProps {
  /** Whether to show only critical items */
  criticalOnly?: boolean;
  /** Callback when all critical items are verified */
  onCriticalComplete?: () => void;
  /** Optional custom checklist items */
  customItems?: ChecklistItem[];
}

const defaultChecklistItems: ChecklistItem[] = [
  // Critical Data Verification
  {
    id: "top-accounts",
    title: "Top 3 accounts appear correctly",
    description: "Verify your most important companies are displayed with correct information",
    category: "data",
    priority: "critical",
    action: "Check Companies list",
    link: "/companies",
  },
  {
    id: "contact-associations",
    title: "Contact associations are accurate",
    description: "Ensure contacts are linked to the correct organizations with proper roles",
    category: "data",
    priority: "critical",
    action: "Review Contacts",
    link: "/contacts",
  },
  {
    id: "opportunities-migrated",
    title: "Open opportunities (formerly deals) migrated",
    description: "All active deals should now appear as opportunities with enhanced fields",
    category: "data",
    priority: "critical",
    action: "View Opportunities",
    link: "/opportunities",
  },
  {
    id: "recent-activities",
    title: "Recent activities preserved",
    description: "Check that your interaction history and notes are intact",
    category: "data",
    priority: "critical",
    action: "Check Activity Log",
    link: "/activity",
  },

  // Important Functionality
  {
    id: "opportunity-creation",
    title: "Can create new opportunities",
    description: "Test creating a new opportunity with the enhanced fields",
    category: "functionality",
    priority: "important",
    action: "Create Test Opportunity",
    link: "/opportunities/create",
  },
  {
    id: "multi-org-contacts",
    title: "Multi-organization contact linking works",
    description: "Verify you can link contacts to multiple organizations",
    category: "functionality",
    priority: "important",
    action: "Edit Contact",
    link: "/contacts",
  },
  {
    id: "search-functionality",
    title: "Search returns expected results",
    description: "Search for known contacts, companies, and opportunities",
    category: "functionality",
    priority: "important",
  },
  {
    id: "filters-working",
    title: "List filters function correctly",
    description: "Test filtering on opportunities, contacts, and companies",
    category: "functionality",
    priority: "important",
  },

  // UI Changes
  {
    id: "navigation-updated",
    title: "Navigation shows 'Opportunities' instead of 'Deals'",
    description: "Verify all menu items use the new terminology",
    category: "ui",
    priority: "important",
    autoVerified: true,
    verified: true,
  },
  {
    id: "url-redirects",
    title: "Old deal URLs redirect to opportunities",
    description: "Bookmarked deal links should redirect properly",
    category: "ui",
    priority: "important",
  },
  {
    id: "new-fields-visible",
    title: "New opportunity fields are visible",
    description: "Check for probability, priority, and lifecycle stage fields",
    category: "ui",
    priority: "important",
    action: "View Opportunity Details",
  },

  // Performance
  {
    id: "page-load-speed",
    title: "Pages load within acceptable time",
    description: "Verify list views and detail pages load smoothly",
    category: "performance",
    priority: "important",
  },
  {
    id: "large-dataset-performance",
    title: "Large lists scroll and filter smoothly",
    description: "Test performance with your largest data sets",
    category: "performance",
    priority: "optional",
  },

  // Optional Verifications
  {
    id: "principal-distributor",
    title: "Principal-distributor relationships (if applicable)",
    description: "Verify B2B relationships are correctly established",
    category: "functionality",
    priority: "optional",
  },
  {
    id: "commission-tracking",
    title: "Commission tracking fields (if applicable)",
    description: "Check commission-related fields if your organization uses them",
    category: "functionality",
    priority: "optional",
  },
];

export const MigrationChecklist = ({
  criticalOnly = false,
  onCriticalComplete,
  customItems = [],
}: MigrationChecklistProps) => {
  const allItems = [...defaultChecklistItems, ...customItems];
  const items = criticalOnly
    ? allItems.filter((item) => item.priority === "critical")
    : allItems;

  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.autoVerified).map((item) => item.id))
  );

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }

      // Check if all critical items are now verified
      const criticalItems = items.filter((item) => item.priority === "critical");
      const criticalChecked = criticalItems.every((item) => newSet.has(item.id));
      if (criticalChecked && onCriticalComplete) {
        onCriticalComplete();
      }

      return newSet;
    });
  };

  const getCategoryIcon = (category: ChecklistItem["category"]) => {
    switch (category) {
      case "data":
        return <Users className="h-4 w-4" />;
      case "functionality":
        return <Briefcase className="h-4 w-4" />;
      case "ui":
        return <Eye className="h-4 w-4" />;
      case "performance":
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "important":
        return "bg-yellow-100 text-yellow-800";
      case "optional":
        return "bg-green-100 text-green-800";
    }
  };

  const groupedItems = items.reduce(
    (groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
      return groups;
    },
    {} as Record<string, ChecklistItem[]>
  );

  const criticalItems = items.filter((item) => item.priority === "critical");
  const criticalCompleted = criticalItems.filter((item) => checkedItems.has(item.id));
  const overallCompleted = items.filter((item) => checkedItems.has(item.id));

  const criticalProgress = criticalItems.length > 0
    ? Math.round((criticalCompleted.length / criticalItems.length) * 100)
    : 100;

  const overallProgress = items.length > 0
    ? Math.round((overallCompleted.length / items.length) * 100)
    : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Post-Migration Verification</h1>
        <p className="text-muted-foreground">
          Please verify that the migration completed successfully by checking the items below
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Verification Progress</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                Critical: {criticalCompleted.length}/{criticalItems.length}
              </Badge>
              <Badge variant="outline">
                Overall: {overallCompleted.length}/{items.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-medium mb-2">
              <span>Critical Items</span>
              <span>{criticalProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${criticalProgress}%` }}
              />
            </div>
          </div>

          {!criticalOnly && (
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>All Items</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {criticalProgress === 100 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                <strong>Excellent!</strong> All critical items verified. Your migration was successful.
              </AlertDescription>
            </Alert>
          )}

          {criticalProgress < 100 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Please verify all critical items</strong> to ensure your data migrated correctly.
                If any critical items fail verification, contact support immediately.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items by Category */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 capitalize">
              {getCategoryIcon(category as ChecklistItem["category"])}
              {category} Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  checkedItems.has(item.id) ? "bg-green-50 border-green-200" : "bg-gray-50"
                }`}
              >
                <Checkbox
                  id={item.id}
                  checked={checkedItems.has(item.id)}
                  onCheckedChange={(checked) => handleItemCheck(item.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-grow space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={item.id} className="font-medium cursor-pointer">
                      {item.title}
                    </label>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.action && (
                    <div className="flex items-center gap-2">
                      {item.link ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            {item.action}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          {item.action}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If any verification items fail or you encounter issues:
          </p>
          <ul className="text-sm space-y-2">
            <li>• Check the <a href="/whats-new" className="text-blue-600 hover:underline">What's New guide</a> for feature explanations</li>
            <li>• Review the <a href="/help/migration-guide" className="text-blue-600 hover:underline">migration documentation</a></li>
            <li>• Contact support at <a href="mailto:support@atomiccrm.com" className="text-blue-600 hover:underline">support@atomiccrm.com</a></li>
          </ul>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Issues:</strong> If critical data verification fails,
              please contact support immediately. Do not proceed with normal operations until resolved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationChecklist;