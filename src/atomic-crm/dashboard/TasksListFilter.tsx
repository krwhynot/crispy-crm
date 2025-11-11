import {
  ListContextProvider,
  ResourceContextProvider,
  useGetIdentity,
  useGetList,
  useList,
} from "ra-core";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { TasksIterator } from "../tasks/TasksIterator";

export const TasksListFilter = ({
  title,
  filter,
  defaultOpen = false,
}: {
  title: string;
  filter: any;
  defaultOpen?: boolean;
}) => {
  const { identity } = useGetIdentity();

  const {
    data: tasks,
    total,
    isPending,
  } = useGetList(
    "tasks",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "due_date", order: "ASC" },
      filter: {
        ...filter,
        sales_id: identity?.id,
      },
    },
    { enabled: !!identity }
  );

  const listContext = useList({
    data: tasks,
    isPending,
    resource: "tasks",
    perPage: 5,
  });

  if (isPending || !tasks || !total) return null;

  return (
    <Collapsible defaultOpen={defaultOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger className="flex items-center justify-between group hover:opacity-80 transition-opacity">
        <p className="text-xs uppercase tracking-wider text-[color:var(--text-subtle)] font-medium">
          {title} ({total})
        </p>
        <ChevronDown className="h-4 w-4 text-[color:var(--text-subtle)] transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2">
        <ResourceContextProvider value="tasks">
          <ListContextProvider value={listContext}>
            <TasksIterator showContact />
          </ListContextProvider>
        </ResourceContextProvider>
        {total > listContext.perPage && (
          <div className="flex justify-center">
            <button
              onClick={(e) => {
                listContext.setPerPage(listContext.perPage + 10);
                e.preventDefault();
              }}
              className="text-sm underline hover:no-underline"
            >
              Load more
            </button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
