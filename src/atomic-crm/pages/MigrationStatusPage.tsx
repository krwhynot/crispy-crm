import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Database,
  Users,
  Building,
  Briefcase,
  Activity,
  RefreshCw,
} from "lucide-react";

interface MigrationStatus {
  phase: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  startTime?: string;
  endTime?: string;
  message?: string;
  recordsProcessed?: number;
  totalRecords?: number;
  errors?: string[];
}

interface MigrationState {
  overallStatus: "not_started" | "running" | "completed" | "failed";
  startTime?: string;
  endTime?: string;
  estimatedCompletionTime?: string;
  phases: MigrationStatus[];
  metrics: {
    dealsToOpportunities: number;
    contactOrganizations: number;
    principalRelationships: number;
    activitiesCreated: number;
    totalErrors: number;
  };
}

// Mock migration state - in production this would come from an API
const createMockMigrationState = (): MigrationState => ({
  overallStatus: "running",
  startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Started 15 minutes ago
  estimatedCompletionTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 minutes from now
  phases: [
    {
      phase: "Pre-Migration Validation",
      status: "completed",
      progress: 100,
      startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
      message: "All validation checks passed",
      recordsProcessed: 1250,
      totalRecords: 1250,
    },
    {
      phase: "Database Backup",
      status: "completed",
      progress: 100,
      startTime: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      message: "Full backup completed successfully",
    },
    {
      phase: "Schema Migration",
      status: "completed",
      progress: 100,
      startTime: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      message: "New tables and relationships created",
    },
    {
      phase: "Data Transformation",
      status: "running",
      progress: 65,
      startTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      message: "Converting deals to opportunities...",
      recordsProcessed: 812,
      totalRecords: 1250,
    },
    {
      phase: "Index Rebuild",
      status: "pending",
      progress: 0,
      message: "Waiting for data transformation...",
    },
    {
      phase: "Validation & Cleanup",
      status: "pending",
      progress: 0,
      message: "Ready to begin after transformation",
    },
  ],
  metrics: {
    dealsToOpportunities: 812,
    contactOrganizations: 1523,
    principalRelationships: 89,
    activitiesCreated: 2341,
    totalErrors: 3,
  },
});

export const MigrationStatusPage = () => {
  const [migrationState, setMigrationState] = useState<MigrationState>(
    createMockMigrationState()
  );
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMigrationState((prev) => {
        const newState = { ...prev };
        const runningPhase = newState.phases.find((p) => p.status === "running");

        if (runningPhase && runningPhase.progress < 100) {
          runningPhase.progress = Math.min(100, runningPhase.progress + Math.random() * 5);
          if (runningPhase.recordsProcessed && runningPhase.totalRecords) {
            runningPhase.recordsProcessed = Math.min(
              runningPhase.totalRecords,
              Math.floor((runningPhase.progress / 100) * runningPhase.totalRecords)
            );
          }
        }

        setLastUpdated(new Date());
        return newState;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: MigrationStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: MigrationStatus["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const overallProgress = Math.round(
    migrationState.phases.reduce((acc, phase) => acc + phase.progress, 0) /
    migrationState.phases.length
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Atomic CRM Migration Status</h1>
        <p className="text-muted-foreground">
          Real-time migration progress and system status
        </p>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Progress</span>
            <Badge className={getStatusColor(migrationState.overallStatus as any)}>
              {migrationState.overallStatus.replace("_", " ").toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{overallProgress}% Complete</span>
            {migrationState.estimatedCompletionTime && (
              <span>
                Est. completion: {new Date(migrationState.estimatedCompletionTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Migration Phases */}
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">Migration Phases</h2>
        {migrationState.phases.map((phase, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(phase.status)}
                  {phase.phase}
                </div>
                <Badge className={getStatusColor(phase.status)}>
                  {phase.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={phase.progress} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>{phase.message}</span>
                <span>{phase.progress}%</span>
              </div>
              {phase.recordsProcessed && phase.totalRecords && (
                <div className="text-sm text-muted-foreground">
                  {phase.recordsProcessed.toLocaleString()} / {phase.totalRecords.toLocaleString()} records processed
                </div>
              )}
              {phase.startTime && (
                <div className="text-sm text-muted-foreground">
                  Duration: {formatDuration(phase.startTime, phase.endTime)}
                </div>
              )}
              {phase.errors && phase.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {phase.errors.length} warning(s): {phase.errors.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Migration Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{migrationState.metrics.dealsToOpportunities}</div>
                <div className="text-sm text-muted-foreground">Opportunities Created</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{migrationState.metrics.contactOrganizations}</div>
                <div className="text-sm text-muted-foreground">Contact Relations</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Building className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{migrationState.metrics.principalRelationships}</div>
                <div className="text-sm text-muted-foreground">Principal Relations</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{migrationState.metrics.activitiesCreated}</div>
                <div className="text-sm text-muted-foreground">Activities Migrated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> The application is currently offline for migration.
          All user sessions have been terminated and new logins are disabled until completion.
          {migrationState.overallStatus === "completed" && (
            <span className="text-green-600 font-medium"> Migration completed successfully! System is coming back online.</span>
          )}
        </AlertDescription>
      </Alert>

      {migrationState.metrics.totalErrors > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Notice:</strong> {migrationState.metrics.totalErrors} non-critical warnings encountered.
            These have been logged and do not affect the migration success. Details will be available in the post-migration report.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MigrationStatusPage;