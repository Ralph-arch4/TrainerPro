"use client";
import { useParams } from "next/navigation";
import DemoPortal from "@/components/DemoPortal";

export default function QuickDemoPublicPage() {
  const { token } = useParams<{ token: string }>();
  return <DemoPortal token={token} />;
}
