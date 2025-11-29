import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

/**
 * Digest Opt-Out Edge Function
 *
 * Purpose: Process one-click unsubscribe requests from daily digest emails
 * Method: GET with token query parameter
 *
 * Security:
 *   - Token is HMAC-signed with 30-day expiration
 *   - Token validated via process_digest_opt_out() PostgreSQL function
 *   - No login required - designed for email link clicks
 *
 * Usage:
 *   GET /functions/v1/digest-opt-out?token=<encrypted_token>
 *
 * Returns:
 *   - HTML page confirming opt-out status
 *   - Appropriate HTTP status codes for success/error
 */

interface OptOutResult {
  success: boolean;
  message?: string;
  email?: string;
  error?: string;
}

/**
 * Generates an HTML response page
 */
function htmlResponse(
  title: string,
  heading: string,
  message: string,
  isSuccess: boolean,
  status = 200
): Response {
  const bgColor = isSuccess ? "#f0fdf4" : "#fef2f2";
  const borderColor = isSuccess ? "#86efac" : "#fecaca";
  const textColor = isSuccess ? "#166534" : "#991b1b";
  const iconColor = isSuccess ? "#22c55e" : "#ef4444";
  const icon = isSuccess
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .status-box {
      background-color: ${bgColor};
      border: 1px solid ${borderColor};
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .icon {
      margin-bottom: 1rem;
    }
    h1 {
      color: ${textColor};
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .message {
      color: #4b5563;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 0.75rem;
    }
    .footer a {
      color: #6b7280;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-box">
      <div class="icon">${icon}</div>
      <h1>${heading}</h1>
    </div>
    <p class="message">${message}</p>
    <div class="footer">
      <p>Crispy CRM - Daily Digest</p>
      <p style="margin-top: 0.5rem;">
        <a href="/">Return to CRM</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

Deno.serve(async (req) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return htmlResponse(
      "Method Not Allowed",
      "Invalid Request",
      "This endpoint only accepts GET requests from email links.",
      false,
      405
    );
  }

  try {
    // Extract token from query parameters
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      console.log("Opt-out request missing token");
      return htmlResponse(
        "Missing Token",
        "Invalid Link",
        "The unsubscribe link is invalid or incomplete. Please use the link from your digest email.",
        false,
        400
      );
    }

    console.log("Processing opt-out request...");

    // Process the opt-out via RPC function
    const { data, error } = await supabaseAdmin.rpc("process_digest_opt_out", {
      p_token: token,
    });

    if (error) {
      console.error("RPC error processing opt-out:", error);
      return htmlResponse(
        "Error",
        "Something Went Wrong",
        "We couldn't process your unsubscribe request. Please try again or contact support.",
        false,
        500
      );
    }

    const result = data as OptOutResult;

    if (!result.success) {
      console.log("Opt-out failed:", result.error);

      // Handle specific error cases
      if (result.error?.includes("expired")) {
        return htmlResponse(
          "Link Expired",
          "Link Expired",
          "This unsubscribe link has expired. Please use the link from a more recent digest email, or update your preferences in the CRM settings.",
          false,
          410
        );
      }

      if (result.error?.includes("invalid")) {
        return htmlResponse(
          "Invalid Link",
          "Invalid Link",
          "This unsubscribe link is invalid. Please use the link from your digest email.",
          false,
          400
        );
      }

      return htmlResponse(
        "Error",
        "Unable to Unsubscribe",
        result.error || "We couldn't process your request. Please try again later.",
        false,
        400
      );
    }

    // Success!
    console.log("Opt-out successful for:", result.email);
    return htmlResponse(
      "Unsubscribed",
      "Successfully Unsubscribed",
      `You've been unsubscribed from daily digest emails${result.email ? ` at ${result.email}` : ""}. You can re-enable notifications anytime in your CRM settings.`,
      true,
      200
    );
  } catch (error) {
    console.error("Unexpected error in digest-opt-out:", error);
    return htmlResponse(
      "Error",
      "Something Went Wrong",
      "An unexpected error occurred. Please try again later or contact support.",
      false,
      500
    );
  }
});
