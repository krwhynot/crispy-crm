import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Clock, AlertTriangle } from "lucide-react";

interface MigrationBannerProps {
  /** Migration scheduled time in ISO format */
  scheduledTime: string;
  /** Optional callback when banner is dismissed */
  onDismiss?: () => void;
  /** Whether banner can be dismissed */
  dismissible?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const MigrationBanner = ({
  scheduledTime,
  onDismiss,
  dismissible = true,
  className = "",
}: MigrationBannerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = new Date(scheduledTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [scheduledTime]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const formatTimeString = (time: TimeRemaining): string => {
    const parts = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0) parts.push(`${time.minutes}m`);
    if (time.seconds > 0 && time.days === 0) parts.push(`${time.seconds}s`);
    return parts.join(" ") || "0s";
  };

  const getUrgencyLevel = (time: TimeRemaining): "low" | "medium" | "high" => {
    const totalMinutes = time.days * 24 * 60 + time.hours * 60 + time.minutes;
    if (totalMinutes <= 30) return "high";
    if (totalMinutes <= 120) return "medium";
    return "low";
  };

  const getVariant = (urgency: "low" | "medium" | "high") => {
    switch (urgency) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "default";
    }
  };

  if (!isVisible || !timeRemaining) {
    return null;
  }

  const urgency = getUrgencyLevel(timeRemaining);
  const timeString = formatTimeString(timeRemaining);

  return (
    <Alert
      variant={getVariant(urgency)}
      className={`mb-4 ${className} ${urgency === "high" ? "animate-pulse" : ""}`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">System Migration in {timeString}</span>
          </div>
          <div className="text-sm">
            {urgency === "high" && (
              <span className="font-bold text-destructive-foreground">
                FINAL WARNING: System will be unavailable during migration.
              </span>
            )}
            {urgency === "medium" && (
              <span>
                The system will be temporarily unavailable for migration to
                enhanced features.
              </span>
            )}
            {urgency === "low" && (
              <span>
                Scheduled maintenance will upgrade deals to opportunities with
                enhanced B2B features.
              </span>
            )}
          </div>
        </div>
        {dismissible && urgency === "low" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-auto p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default MigrationBanner;