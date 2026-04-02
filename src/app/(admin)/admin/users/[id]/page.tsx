export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { UserForm } from "@/components/admin/user-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isGroupLeader: true },
  });

  if (!user) notFound();

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Edit User"
        description={`Editing ${user.name}`}
      />
      <div className="p-6">
        <UserForm
          userId={user.id}
          defaultValues={{
            name: user.name,
            email: user.email,
            role: user.role as "ADMIN" | "USER",
            isGroupLeader: user.isGroupLeader,
          }}
        />
      </div>
    </div>
  );
}
