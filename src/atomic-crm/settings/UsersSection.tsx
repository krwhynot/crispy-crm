import { useEffect } from "react";
import { useRedirect } from "react-admin";

/**
 * Users management section for Settings page
 * Admin-only: Redirects to /sales for team management
 *
 * CONSOLIDATED: User management moved to /sales resource
 * This component now serves as a redirect for discoverability
 * (users clicking "Team" in Settings still reach the right place)
 */
export const UsersSection = () => {
  const redirect = useRedirect();

  useEffect(() => {
    // Redirect to the consolidated /sales resource
    redirect("/sales");
  }, [redirect]);

  // Show brief loading state while redirecting
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">Redirecting to Team Management...</p>
    </div>
  );
};
