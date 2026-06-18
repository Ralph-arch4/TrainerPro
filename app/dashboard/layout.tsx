import AppNav from "@/components/AppNav";
import SupabaseDataLoader from "@/components/SupabaseDataLoader";
import ToastProvider from "@/components/Toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex" style={{ background: "var(--black)" }}>
      <AppNav />
      <SupabaseDataLoader />
      <main className="dashboard-main flex-1 lg:ml-60 min-h-dvh">
        {children}
      </main>
      <ToastProvider />
    </div>
  );
}
