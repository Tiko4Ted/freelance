import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HelpCenterClient } from "@/components/help-center-client";

export const dynamic = "force-dynamic";

export default async function HelpCenterPage() {
  const session = await auth();
  if (session?.user?.role === Role.ADMIN) {
    redirect("/admin");
  }

  return <HelpCenterClient />;
}
