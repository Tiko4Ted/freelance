import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HelpCenterClient } from "@/components/help-center-client";

export const dynamic = "force-dynamic";

type HelpCenterCategoryPageProps = {
  params: Promise<{
    categoryId: string;
  }>;
};

export default async function HelpCenterCategoryPage({
  params,
}: HelpCenterCategoryPageProps) {
  const { categoryId } = await params;
  const session = await auth();
  if (session?.user?.role === Role.ADMIN) {
    redirect("/admin");
  }

  return <HelpCenterClient categoryId={categoryId} key={categoryId} />;
}
