import { Card } from "@/components/ui/card";
import { endOfToday, endOfTomorrow, endOfWeek, getDay, startOfToday } from "date-fns";
import { CheckSquare } from "lucide-react";
import { AddTask } from "../tasks/AddTask";
import { TasksListEmpty } from "./TasksListEmpty";
import { TasksListFilter } from "./TasksListFilter";

const trackDashboardEvent = (cardType: string) => {
  console.log(`dashboard_card_click: ${cardType}`, {
    timestamp: new Date().toISOString(),
    viewport: window.innerWidth < 768 ? "mobile" : "desktop",
  });
};

const today = new Date();
const todayDayOfWeek = getDay(today);
const isBeforeFriday = todayDayOfWeek < 5; // Friday is represented by 5
const startOfTodayDateISO = startOfToday().toISOString();
const endOfTodayDateISO = endOfToday().toISOString();
const endOfTomorrowDateISO = endOfTomorrow().toISOString();
const endOfWeekDateISO = endOfWeek(today, { weekStartsOn: 0 }).toISOString();

const taskFilters = {
  overdue: { "completed_at@is": null, "due_date@lt": startOfTodayDateISO },
  today: {
    "completed_at@is": null,
    "due_date@gte": startOfTodayDateISO,
    "due_date@lte": endOfTodayDateISO,
  },
  tomorrow: {
    "completed_at@is": null,
    "due_date@gt": endOfTodayDateISO,
    "due_date@lt": endOfTomorrowDateISO,
  },
  thisWeek: {
    "completed_at@is": null,
    "due_date@gte": endOfTomorrowDateISO,
    "due_date@lte": endOfWeekDateISO,
  },
  later: { "completed_at@is": null, "due_date@gt": endOfWeekDateISO },
};

export const TasksList = () => {
  return (
    <div className="flex flex-col gap-compact">
      <div className="flex items-center">
        <div className="mr-compact flex">
          <CheckSquare className="text-[color:var(--text-subtle)] w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-[color:var(--text-title)] uppercase tracking-tight flex-1">
          Upcoming Tasks
        </h2>
        <AddTask display="icon" selectContact />
      </div>
      <Card
        className="rounded-xl p-content mb-compact cursor-pointer"
        onClick={() => trackDashboardEvent("tasks")}
      >
        <div className="flex flex-col gap-section max-h-[320px] overflow-y-auto">
          <TasksListEmpty />
          <TasksListFilter title="Overdue" filter={taskFilters.overdue} defaultOpen={true} />
          <TasksListFilter title="Today" filter={taskFilters.today} defaultOpen={true} />
          <TasksListFilter title="Tomorrow" filter={taskFilters.tomorrow} defaultOpen={false} />
          {isBeforeFriday && (
            <TasksListFilter title="This week" filter={taskFilters.thisWeek} defaultOpen={false} />
          )}
          <TasksListFilter title="Later" filter={taskFilters.later} defaultOpen={false} />
        </div>
      </Card>
    </div>
  );
};
