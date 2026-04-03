import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={cn("bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && <p className="text-xs text-zinc-600 mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
