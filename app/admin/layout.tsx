import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ForbiddenError, UnauthorizedError, requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireRole(Role.ADMIN);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login?callbackUrl=/admin");
    }

    if (error instanceof ForbiddenError) {
      redirect("/home");
    }

    redirect("/login?callbackUrl=/admin");
  }

  return (
    <>
      <AdminSidebar />
      {children}
    </>
  );
}
