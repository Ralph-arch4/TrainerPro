import AppNav from "@/components/AppNav";
import SupabaseDataLoader from "@/components/SupabaseDataLoader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--black)" }}>
      <AppNav />
      <SupabaseDataLoader />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
