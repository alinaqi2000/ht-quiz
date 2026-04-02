import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export async function AdminHeader({
  title,
  description,
  children,
}: AdminHeaderProps) {
  const session = await auth();

  return (
    <div className="border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-white truncate">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {children}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white">
                {session?.user?.name}
              </p>
              <Badge
                variant="outline"
                className="text-xs border-sky-600/50 text-sky-400 py-0"
              >
                Admin
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
