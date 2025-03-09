import { DateFormatter } from "@internationalized/date";

export default function formatDate(
  date: Date | string,
  withHours: boolean = false,
  locale: string = "en-US",
): string {
  const df = new DateFormatter(locale, {
    dateStyle: "medium",
    ...(withHours && {
      hourCycle: "h24",
      timeStyle: "short",
    }),
  });

  return df.format(new Date(date));
}
