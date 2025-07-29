import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";

const chartConfig = {
  runtime: {
    label: "Runtime",
    color: "var(--primary)", // Ensure your CSS defines this variable
  },
};

export function WatchTimeChart() {
  const [data, setData] = useState<{ date: string; runtime: number }[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchWatchTimeData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: movies, error } = await supabase
        .from("user_movies")
        .select("runtime, watched_at")
        .eq("user_id", user.id)
        .eq("status", "watched");

      if (error || !movies) {
        console.error("Failed to fetch movies:", error);
        setData([]);
        return;
      }

      const grouped: Record<string, number> = {};

      movies.forEach((movie: { runtime: number; watched_at: any }) => {
        const runtime = movie.runtime ?? 0;
        const watchedDate = movie.watched_at;
        if (!watchedDate) return;

        const date = new Date(watchedDate).toISOString().slice(0, 10);
        grouped[date] = (grouped[date] || 0) + runtime;
      });

      const formattedData = Object.entries(grouped).map(([date, runtime]) => ({
        date,
        runtime,
      }));

      formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setData(formattedData);
    };

    fetchWatchTimeData();
  }, []);

  if (data.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Watch Time Trend</CardTitle>
          <CardDescription>No watch time data available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Watch Time Trend</CardTitle>
        <CardDescription>Daily runtime (minutes) from watched movies over the last 3 months.</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillRuntime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-runtime)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-runtime)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : data.length - 1}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value as string).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  formatter={(val: number, name: string) => <span>{`${val} mins`}</span>}
                />
              }
            />
            <Area dataKey="runtime" type="natural" fill="url(#fillRuntime)" stroke="var(--color-runtime)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
