import AppNav from "@/components/AppNav";
import SupabaseDataLoader from "@/components/SupabaseDataLoader";
import ToastProvider from "@/components/Toast";
import PaymentNotice from "@/components/PaymentNotice";
import PlanBanner from "@/components/PlanBanner";
import TrialGate from "@/components/TrialGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex" style={{ background: "var(--black)" }}>
      <AppNav />
      <SupabaseDataLoader />
      <main className="dashboard-main flex-1 min-w-0 lg:ml-60 min-h-dvh">
        <PlanBanner />
        <TrialGate>{children}</TrialGate>
      </main>
      <ToastProvider />
      <PaymentNotice />
    </div>
  );
}
