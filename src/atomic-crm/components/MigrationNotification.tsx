import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface MigrationNotificationProps {
  /** Type of notification template */
  type: "24h" | "2h" | "30m" | "completion" | "custom";
  /** Migration scheduled time in ISO format */
  scheduledTime?: string;
  /** Custom message for notification */
  customMessage?: string;
  /** Recipient email addresses */
  recipients?: string[];
  /** Callback when notification is sent */
  onSend?: (template: EmailTemplate) => Promise<void>;
  /** Whether notification is being sent */
  sending?: boolean;
  /** Preview mode only */
  previewOnly?: boolean;
}

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  urgency: "low" | "medium" | "high";
  scheduledTime?: string;
}

export const MigrationNotification = ({
  type,
  scheduledTime,
  customMessage,
  recipients = [],
  onSend,
  sending = false,
  previewOnly = false,
}: MigrationNotificationProps) => {
  const [templateSent, setTemplateSent] = useState(false);

  const generateTemplate = (): EmailTemplate => {
    const formattedTime = scheduledTime
      ? new Date(scheduledTime).toLocaleString()
      : "TBD";

    switch (type) {
      case "24h":
        return {
          subject: "🔧 Atomic CRM Migration Tomorrow - Enhanced B2B Features Coming",
          urgency: "low",
          scheduledTime,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">System Migration Tomorrow</h2>
              <p>Dear Atomic CRM User,</p>
              <p>We're excited to announce that tomorrow (${formattedTime}) we'll be upgrading your CRM with powerful new B2B features:</p>
              <ul>
                <li><strong>Enhanced Opportunities:</strong> Deals are becoming Opportunities with advanced tracking</li>
                <li><strong>Multi-Organization Contacts:</strong> Link contacts to multiple companies</li>
                <li><strong>Principal-Distributor Relationships:</strong> Full B2B workflow support</li>
                <li><strong>Commission Tracking:</strong> Automated commission calculations</li>
              </ul>
              <h3>What to Expect:</h3>
              <ul>
                <li>📱 System will be unavailable for 30-60 minutes</li>
                <li>🔄 All your data will be preserved and enhanced</li>
                <li>🎯 New features will be immediately available</li>
                <li>📚 Feature guide will be provided post-migration</li>
              </ul>
              <p><strong>Action Required:</strong> Please save any open work before ${formattedTime}</p>
              <p>Questions? Contact support at support@atomiccrm.com</p>
            </div>
          `,
          textContent: `System Migration Tomorrow - ${formattedTime}

We're upgrading Atomic CRM with new B2B features:
- Enhanced Opportunities (deals → opportunities)
- Multi-Organization Contacts
- Principal-Distributor Relationships
- Commission Tracking

System will be unavailable for 30-60 minutes.
All data will be preserved and enhanced.

Action Required: Save any open work before ${formattedTime}

Questions? Contact support@atomiccrm.com`,
        };

      case "2h":
        return {
          subject: "⚠️ Atomic CRM Migration in 2 Hours - Prepare for Downtime",
          urgency: "medium",
          scheduledTime,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Migration Starting in 2 Hours</h2>
              <p><strong>System Downtime: ${formattedTime}</strong></p>
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">⚠️ Final Preparation Required</h3>
                <ul style="color: #92400e;">
                  <li>Save all open deals and contacts</li>
                  <li>Complete any urgent data entry</li>
                  <li>Log out of the system before ${formattedTime}</li>
                </ul>
              </div>
              <h3>Migration Details:</h3>
              <ul>
                <li>Duration: 30-60 minutes</li>
                <li>Start Time: ${formattedTime}</li>
                <li>Status Updates: Available at status.atomiccrm.com</li>
              </ul>
              <p><strong>Post-Migration:</strong> You'll receive a completion email with new feature overview.</p>
            </div>
          `,
          textContent: `MIGRATION STARTING IN 2 HOURS

System Downtime: ${formattedTime}

FINAL PREPARATION REQUIRED:
- Save all open deals and contacts
- Complete any urgent data entry
- Log out before ${formattedTime}

Duration: 30-60 minutes
Status Updates: status.atomiccrm.com

Post-migration completion email will follow.`,
        };

      case "30m":
        return {
          subject: "🚨 FINAL WARNING: Atomic CRM Migration in 30 Minutes",
          urgency: "high",
          scheduledTime,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">🚨 FINAL WARNING: 30 Minutes Until Migration</h2>
              <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
                <h3 style="color: #dc2626; margin-top: 0;">System Going Offline: ${formattedTime}</h3>
                <p style="color: #dc2626; font-weight: bold;">IMMEDIATE ACTION REQUIRED:</p>
                <ol style="color: #dc2626;">
                  <li>Save ALL open work NOW</li>
                  <li>Log out of Atomic CRM</li>
                  <li>Do not attempt to log in during migration</li>
                </ol>
              </div>
              <p><strong>Migration Status:</strong> Real-time updates at <a href="https://status.atomiccrm.com">status.atomiccrm.com</a></p>
              <p><strong>Expected Completion:</strong> Within 60 minutes</p>
              <p><strong>Support:</strong> For urgent issues during migration, email emergency@atomiccrm.com</p>
            </div>
          `,
          textContent: `🚨 FINAL WARNING: 30 MINUTES UNTIL MIGRATION

System Going Offline: ${formattedTime}

IMMEDIATE ACTION REQUIRED:
1. Save ALL open work NOW
2. Log out of Atomic CRM
3. Do not attempt to log in during migration

Status: status.atomiccrm.com
Expected Completion: Within 60 minutes
Emergency Support: emergency@atomiccrm.com`,
        };

      case "completion":
        return {
          subject: "✅ Atomic CRM Migration Complete - New Features Available!",
          urgency: "low",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">✅ Migration Complete - Welcome to Enhanced Atomic CRM!</h2>
              <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #059669; margin-top: 0;">🎉 Your CRM is Ready with New Features</h3>
                <p style="color: #065f46;">All your data has been successfully migrated and enhanced.</p>
              </div>

              <h3>What's New:</h3>
              <ul>
                <li><strong>Opportunities:</strong> Deals are now Opportunities with enhanced tracking</li>
                <li><strong>Multi-Organization Contacts:</strong> Link contacts to multiple companies</li>
                <li><strong>Principal-Distributor Workflows:</strong> Full B2B relationship management</li>
                <li><strong>Commission Tracking:</strong> Automated calculations and reporting</li>
              </ul>

              <h3>Next Steps:</h3>
              <ol>
                <li><a href="/migration/checklist" style="color: #2563eb;">Complete verification checklist</a></li>
                <li><a href="/whats-new" style="color: #2563eb;">Take the new features tour</a></li>
                <li>Review your top accounts and opportunities</li>
              </ol>

              <p><strong>Need Help?</strong> Visit our <a href="/help/migration-guide">migration guide</a> or contact support.</p>
            </div>
          `,
          textContent: `✅ MIGRATION COMPLETE - Welcome to Enhanced Atomic CRM!

Your CRM is ready with new features. All data successfully migrated.

WHAT'S NEW:
- Opportunities (enhanced deals)
- Multi-Organization Contacts
- Principal-Distributor Workflows
- Commission Tracking

NEXT STEPS:
1. Complete verification checklist (/migration/checklist)
2. Take new features tour (/whats-new)
3. Review your top accounts and opportunities

Need Help? Visit migration guide or contact support.`,
        };

      case "custom":
        return {
          subject: "Atomic CRM Migration Update",
          urgency: "medium",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Migration Update</h2>
              <p>${customMessage || "Custom migration notification"}</p>
              ${scheduledTime ? `<p><strong>Scheduled Time:</strong> ${formattedTime}</p>` : ""}
            </div>
          `,
          textContent: customMessage || "Custom migration notification",
        };

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  };

  const template = generateTemplate();

  const handleSend = async () => {
    if (onSend) {
      try {
        await onSend(template);
        setTemplateSent(true);
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <Clock className="h-4 w-4" />;
      case "low":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Migration Notification Template
          </div>
          <Badge className={getUrgencyColor(template.urgency)}>
            {getUrgencyIcon(template.urgency)}
            {template.urgency.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Subject:</label>
          <div className="mt-1 p-3 bg-muted rounded border">
            {template.subject}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Recipients:</label>
          <div className="mt-1 text-sm text-muted-foreground">
            {recipients.length > 0 ? (
              recipients.join(", ")
            ) : (
              <span>All active users</span>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Preview:</label>
          <div
            className="mt-1 p-4 bg-background border rounded max-h-64 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: template.htmlContent }}
          />
        </div>

        {!previewOnly && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {templateSent ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Notification sent successfully
                </span>
              ) : (
                `Ready to send to ${recipients.length || "all"} users`
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || templateSent}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {sending ? "Sending..." : templateSent ? "Sent" : "Send Notification"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationNotification;