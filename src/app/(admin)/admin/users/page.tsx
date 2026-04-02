export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { UserTable } from "@/components/admin/user-table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isGroupLeader: true,
      createdAt: true,
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Users"
        description={`${users.length} total users`}
      >
        <Button
          asChild
          className="bg-sky-600 hover:bg-sky-700 text-white"
        >
          <Link href="/admin/users/new">
            <Plus className="w-4 h-4 mr-2" />
            New User
          </Link>
        </Button>
      </AdminHeader>

      <div className="p-6">
        <UserTable users={JSON.parse(JSON.stringify(users))} />
      </div>
    </div>
  );
}
