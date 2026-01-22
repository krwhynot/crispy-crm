import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Users,
  Building,
  Activity,
  Target,
  Network,
  CheckCircle,
  ArrowRight,
  Play,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureTour {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "opportunities" | "contacts" | "organizations" | "activities" | "b2b";
  isNew: boolean;
  steps?: TourStep[];
}

interface TourStep {
  title: string;
  description: string;
  screenshot?: string;
  action?: string;
  tip?: string;
}

const newFeatures: FeatureTour[] = [
  {
    id: "opportunities",
    title: "Enhanced Opportunities",
    description:
      "Deals are now Opportunities with advanced tracking, probability scoring, and lifecycle management.",
    icon: <Briefcase className="h-6 w-6" />,
    category: "opportunities",
    isNew: true,
    steps: [
      {
        title: "Enhanced Fields",
        description:
          "Opportunities now include probability percentage, priority levels, and detailed lifecycle stages.",
        action: "View an existing opportunity to see new fields",
        tip: "Probability is automatically calculated based on stage, but you can override it manually.",
      },
      {
        title: "Advanced Stages",
        description:
          "Food service pipeline: New Lead, Initial Outreach, Sample/Visit Offered, Awaiting Response, Feedback Logged, Demo Scheduled, Closed Won/Lost.",
        action: "Change an opportunity stage to see automatic probability updates",
        tip: "Stages can be updated manually or automatically based on activities.",
      },
      {
        title: "Priority Management",
        description:
          "Set priority levels (Low, Medium, High, Critical) to focus on what matters most.",
        action: "Set high priority on your most important opportunities",
        tip: "High and Critical priorities appear prominently in dashboards.",
      },
    ],
  },
  {
    id: "multi-org-contacts",
    title: "Multi-Organization Contacts",
    description:
      "Contacts can now be associated with multiple organizations with different roles and influence levels.",
    icon: <Users className="h-6 w-6" />,
    category: "contacts",
    isNew: true,
    steps: [
      {
        title: "Primary Organization",
        description: "Each contact has a primary organization shown prominently in their profile.",
        action: "Check your top contacts to verify primary organizations",
        tip: "Primary organization determines default company context for new opportunities.",
      },
      {
        title: "Associated Organizations",
        description:
          "View all organizations a contact is connected to in the 'Organizations' section.",
        action: "Add a contact to an additional organization",
        tip: "Use this for consultants, contractors, or people who work with multiple organizations.",
      },
      {
        title: "Role and Influence",
        description:
          "Track decision authority and purchase influence for each organization relationship.",
        action: "Set influence levels for key contacts",
        tip: "High influence contacts are highlighted in opportunity planning.",
      },
    ],
  },
  {
    id: "organization-types",
    title: "Organization Types & Hierarchies",
    description:
      "Organizations now have types (Customer, Principal, Distributor, etc.) and can form hierarchical relationships.",
    icon: <Building className="h-6 w-6" />,
    category: "organizations",
    isNew: true,
    steps: [
      {
        title: "Organization Types",
        description:
          "Classify organizations as Customer, Principal, Distributor, Prospect, or Unknown.",
        action: "Review your top organizations and set appropriate types",
        tip: "Types help with filtering and reporting on different relationship categories.",
      },
      {
        title: "Priority Levels",
        description: "Assign A/B/C/D priority levels for account management focus.",
        action: "Set A priority for your most important accounts",
        tip: "A-priority accounts get highlighted treatment throughout the system.",
      },
      {
        title: "Parent Organizations",
        description: "Link subsidiaries to parent organizations for better relationship mapping.",
        action: "Set up parent-child relationships for related organizations",
        tip: "This helps track enterprise accounts with multiple entities.",
      },
    ],
  },
  {
    id: "activities-system",
    title: "Enhanced Activities System",
    description:
      "New activity tracking with interactions (opportunity-specific) and engagements (general relationship building).",
    icon: <Activity className="h-6 w-6" />,
    category: "activities",
    isNew: true,
    steps: [
      {
        title: "Interactions vs Engagements",
        description:
          "Interactions are tied to specific opportunities. Engagements are general relationship activities.",
        action: "Log an interaction for a specific opportunity",
        tip: "Use interactions for sales activities, engagements for relationship building.",
      },
      {
        title: "Activity Types",
        description:
          "Enhanced types: Call, Email, Meeting, Demo, Follow-up, Visit, Proposal, Negotiation.",
        action: "Create activities with the new detailed types",
        tip: "Detailed types improve reporting and activity analysis.",
      },
      {
        title: "Follow-up Tracking",
        description: "Activities can automatically schedule follow-ups with reminders.",
        action: "Set a follow-up when creating an activity",
        tip: "Follow-ups appear in your task dashboard with due dates.",
      },
    ],
  },
  {
    id: "b2b-features",
    title: "B2B Principal-Distributor Workflows",
    description:
      "Full support for complex B2B relationships including principal-distributor partnerships and commission tracking.",
    icon: <Network className="h-6 w-6" />,
    category: "b2b",
    isNew: true,
    steps: [
      {
        title: "Principal Relationships",
        description: "Mark organizations as principals and track their distributor networks.",
        action: "Set up principal organizations if applicable",
        tip: "Principals are suppliers who work through distributor channels.",
      },
      {
        title: "Opportunity Participants",
        description:
          "Track multiple organizations in a single opportunity (customer, principal, distributor).",
        action: "Add participants to a complex B2B opportunity",
        tip: "Each participant can have different roles and commission rates.",
      },
      {
        title: "Commission Tracking",
        description: "Set commission rates and territories for distributor relationships.",
        action: "Configure commission rates for relevant opportunities",
        tip: "Commission data helps with distributor performance analysis.",
      },
    ],
  },
];

export const WhatsNew = () => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureTour>(newFeatures[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedFeatures, setCompletedFeatures] = useState<Set<string>>(new Set());

  const handleFeatureComplete = (featureId: string) => {
    setCompletedFeatures((prev) => new Set([...prev, featureId]));
  };

  const nextStep = () => {
    if (selectedFeature.steps && currentStep < selectedFeature.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startTour = (feature: FeatureTour) => {
    setSelectedFeature(feature);
    setCurrentStep(0);
  };

  const getCategoryColor = (category: FeatureTour["category"]) => {
    switch (category) {
      case "opportunities":
        return "bg-primary/10 text-primary";
      case "contacts":
        return "bg-success-subtle text-success-default";
      case "organizations":
        return "bg-primary/10 text-primary";
      case "activities":
        return "bg-primary/10 text-primary";
      case "b2b":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">What's New in Atomic CRM</h1>
        <p className="text-muted-foreground">
          Discover the powerful new features and enhancements from your migration
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Feature Overview</TabsTrigger>
          <TabsTrigger value="tour">Interactive Tour</TabsTrigger>
          <TabsTrigger value="resources">Resources & Help</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {newFeatures.map((feature) => (
              <Card key={feature.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      {feature.title}
                    </div>
                    <div className="flex gap-2">
                      {feature.isNew && <Badge variant="default">NEW</Badge>}
                      <Badge className={cn(getCategoryColor(feature.category))}>
                        {feature.category.toUpperCase()}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{feature.description}</p>
                  {completedFeatures.has(feature.id) && (
                    <div className="flex items-center gap-2 text-success-default">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Tour Completed</span>
                    </div>
                  )}
                  <AdminButton
                    onClick={() => startTour(feature)}
                    variant="outline"
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Feature Tour
                  </AdminButton>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tour" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedFeature.icon}
                  {selectedFeature.title}
                </div>
                <Badge className={cn(getCategoryColor(selectedFeature.category))}>
                  {selectedFeature.steps && (
                    <span>
                      Step {currentStep + 1} of {selectedFeature.steps.length}
                    </span>
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedFeature.steps && selectedFeature.steps.length > 0 ? (
                <>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentStep + 1) / selectedFeature.steps.length) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      {selectedFeature.steps[currentStep].title}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedFeature.steps[currentStep].description}
                    </p>

                    {selectedFeature.steps[currentStep].action && (
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <h4 className="font-medium text-primary mb-2">Try it now:</h4>
                        <p className="text-primary">{selectedFeature.steps[currentStep].action}</p>
                      </div>
                    )}

                    {selectedFeature.steps[currentStep].tip && (
                      <div className="bg-warning/10 p-4 rounded-lg">
                        <h4 className="font-medium text-warning mb-2">💡 Pro Tip:</h4>
                        <p className="text-warning">{selectedFeature.steps[currentStep].tip}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <AdminButton onClick={prevStep} disabled={currentStep === 0} variant="outline">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </AdminButton>
                    <div className="space-x-2">
                      {currentStep === selectedFeature.steps.length - 1 ? (
                        <AdminButton
                          onClick={() => handleFeatureComplete(selectedFeature.id)}
                          className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Tour
                        </AdminButton>
                      ) : (
                        <AdminButton onClick={nextStep}>
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </AdminButton>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select a feature from the overview tab to start the interactive tour.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose a Feature to Explore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {newFeatures.map((feature) => (
                  <AdminButton
                    key={feature.id}
                    onClick={() => startTour(feature)}
                    variant={selectedFeature.id === feature.id ? "default" : "outline"}
                    className="h-auto p-3 justify-start"
                  >
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <div className="text-left">
                        <div className="font-medium">{feature.title}</div>
                        {completedFeatures.has(feature.id) && (
                          <CheckCircle className="h-3 w-3 text-success-default mt-1" />
                        )}
                      </div>
                    </div>
                  </AdminButton>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <a
                    href="/help/migration-guide"
                    className="block p-3 rounded-lg border hover:bg-secondary transition-colors"
                  >
                    <div className="font-medium">Migration Guide</div>
                    <div className="text-sm text-muted-foreground">
                      Complete guide to the migration changes
                    </div>
                  </a>
                  <a
                    href="/help/opportunities"
                    className="block p-3 rounded-lg border hover:bg-secondary transition-colors"
                  >
                    <div className="font-medium">Opportunities Help</div>
                    <div className="text-sm text-muted-foreground">
                      Learn about enhanced opportunity management
                    </div>
                  </a>
                  <a
                    href="/help/b2b-workflows"
                    className="block p-3 rounded-lg border hover:bg-secondary transition-colors"
                  >
                    <div className="font-medium">B2B Workflows</div>
                    <div className="text-sm text-muted-foreground">
                      Principal-distributor relationship guide
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <AdminButton asChild variant="outline" className="w-full justify-start">
                    <a href="/migration/checklist">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Verification Checklist
                    </a>
                  </AdminButton>
                  <AdminButton asChild variant="outline" className="w-full justify-start">
                    <a href="/opportunities">
                      <Briefcase className="h-4 w-4 mr-2" />
                      View Your Opportunities
                    </a>
                  </AdminButton>
                  <AdminButton asChild variant="outline" className="w-full justify-start">
                    <a href="/contacts">
                      <Users className="h-4 w-4 mr-2" />
                      Review Contact Organizations
                    </a>
                  </AdminButton>
                  <AdminButton asChild variant="outline" className="w-full justify-start">
                    <a href="/organizations">
                      <Building className="h-4 w-4 mr-2" />
                      Set Organization Types
                    </a>
                  </AdminButton>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Support & Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Need help with the new features or have feedback about the migration?
                </p>
                <div className="flex gap-3">
                  <AdminButton asChild>
                    <a href="mailto:support@atomiccrm.com">Contact Support</a>
                  </AdminButton>
                  <AdminButton asChild variant="outline">
                    <a href="/feedback">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Share Feedback
                    </a>
                  </AdminButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsNew;
