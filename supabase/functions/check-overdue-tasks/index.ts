import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

/**
 * Check Overdue Tasks Edge Function
 *
 * Purpose: Create notifications for tasks that are overdue
 * Runs: Daily via pg_cron at 9 AM server time
 *
 * Process:
 * 1. Query tasks where due_date < today AND completed = false AND overdue_notified_at IS NULL
 * 2. For each overdue task, get the user_id from sales table
 * 3. Create notification record
 * 4. Update task with overdue_notified_at timestamp
 *
 * Prevents duplicates: Only notifies tasks where overdue_notified_at IS NULL
 */

interface Sales {
  id: number;
  user_id: string;
}

// Authentication secrets
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    // Verify request is from authorized source (cron or service role)
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || (token !== CRON_SECRET && token !== SERVICE_ROLE_KEY)) {
      console.warn("Unauthorized access attempt to check-overdue-tasks");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Cron functions require authentication" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Starting overdue tasks check...");

    // Get today's date at midnight (server time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Query overdue tasks that haven't been notified yet
    const { data: overdueTasks, error: tasksError } = await supabaseAdmin
      .from("tasks")
      .select("id, title, due_date, sales_id, contact_id, opportunity_id")
      .lt("due_date", todayISO)
      .eq("completed", false)
      .is("overdue_notified_at", null)
      .not("sales_id", "is", null); // Only tasks assigned to someone

    if (tasksError) {
      console.error("Error querying overdue tasks:", tasksError);
      return new Response(
        JSON.stringify({ error: "Failed to query overdue tasks", details: tasksError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!overdueTasks || overdueTasks.length === 0) {
      console.log("No overdue tasks found");
      return new Response(JSON.stringify({ message: "No overdue tasks to notify", count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${overdueTasks.length} overdue tasks`);

    // Get sales records to map sales_id to user_id
    const salesIds = [...new Set(overdueTasks.map((t) => t.sales_id))];
    const { data: salesRecords, error: salesError } = await supabaseAdmin
      .from("sales")
      .select("id, user_id")
      .in("id", salesIds);

    if (salesError) {
      console.error("Error querying sales records:", salesError);
      return new Response(
        JSON.stringify({ error: "Failed to query sales records", details: salesError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a map of sales_id -> user_id
    const salesMap = new Map<number, string>();
    (salesRecords || []).forEach((sale: Sales) => {
      salesMap.set(sale.id, sale.user_id);
    });

    // Create notifications for each overdue task
    const notifications: Array<{
      user_id: string;
      type: string;
      message: string;
      entity_type: string;
      entity_id: number;
    }> = [];

    const tasksToUpdate: number[] = [];

    for (const task of overdueTasks) {
      const userId = salesMap.get(task.sales_id);
      if (!userId) {
        console.warn(`No user_id found for sales_id ${task.sales_id}, skipping task ${task.id}`);
        continue;
      }

      // Calculate days overdue
      const dueDate = new Date(task.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const notification = {
        user_id: userId,
        type: "task_overdue",
        message: `Task "${task.title}" is ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
        entity_type: "task",
        entity_id: task.id,
      };

      notifications.push(notification);
      tasksToUpdate.push(task.id);
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabaseAdmin.from("notifications").insert(notifications);

      if (notifError) {
        console.error("Error creating notifications:", notifError);
        return new Response(
          JSON.stringify({ error: "Failed to create notifications", details: notifError }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log(`Created ${notifications.length} notifications`);

      // Update tasks with overdue_notified_at timestamp
      const { error: updateError } = await supabaseAdmin
        .from("tasks")
        .update({ overdue_notified_at: new Date().toISOString() })
        .in("id", tasksToUpdate);

      if (updateError) {
        console.error("Error updating tasks:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update tasks", details: updateError }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log(`Updated ${tasksToUpdate.length} tasks with notification timestamp`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Overdue task notifications created successfully",
        tasksProcessed: overdueTasks.length,
        notificationsCreated: notifications.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in check-overdue-tasks:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
