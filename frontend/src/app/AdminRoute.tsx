import { useAuth } from "../hooks/useAuth";
import { ShieldX } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-ink-500">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldX size={26} className="text-signal-red" />
        </div>
        <p className="text-lg font-semibold text-ink-700">Access Denied</p>
        <p className="text-sm text-ink-500">
          You need admin privileges to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
