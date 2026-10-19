"use client";
import { useParams } from "next/navigation";
import ClientPortal from "@/components/ClientPortal";

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  return <ClientPortal token={token} />;
}
