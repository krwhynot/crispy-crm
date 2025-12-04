import { formatRelative, parseISO, isValid } from "date-fns";

export function RelativeDate({ date }: { date: string }) {
  const parsedDate = parseISO(date);

  if (!isValid(parsedDate)) {
    return null;
  }

  return formatRelative(parsedDate, new Date());
}
