import { auth } from "@/lib/auth";

interface AdminHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export async function AdminHeader({ title, description, children }: AdminHeaderProps) {
  const session = await auth();

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-white truncate">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {children}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <span className="text-black text-xs font-bold">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white leading-tight">
                {session?.user?.name}
              </p>
              <p className="text-xs text-amber-500/70">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
