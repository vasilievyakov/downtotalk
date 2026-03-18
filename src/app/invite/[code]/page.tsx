import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InviteClient } from "./invite-client";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?returnTo=/invite/${code}`);
  }

  return <InviteClient code={code} />;
}
