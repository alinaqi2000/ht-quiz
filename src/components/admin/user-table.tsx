"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isGroupLeader: boolean;
  createdAt: string;
  _count: { attempts: number };
}

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!res.ok) {
      toast.error("Failed to delete user");
      return;
    }

    toast.success("User deleted");
    router.refresh();
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No users yet. Create your first user.
      </div>
    );
  }

  function ActionButtons({ user }: { user: User }) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Quiz Links"
        >
          <Link href={`/admin/users/${user.id}/links`}>
            <LinkIcon className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Edit"
        >
          <Link href={`/admin/users/${user.id}`}>
            <Edit className="w-4 h-4" />
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              disabled={deletingId === user.id}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800 mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Are you sure you want to delete {user.name}? This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(user.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium truncate">{user.name}</p>
                  {user.isGroupLeader && (
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-600/50 text-amber-400"
                    >
                      Leader
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      user.role === "ADMIN"
                        ? "border-amber-500/40 text-amber-400 text-xs"
                        : "border-zinc-700 text-zinc-400 text-xs"
                    }
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mt-0.5 truncate">
                  {user.email}
                </p>
              </div>
              <ActionButtons user={user} />
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span>{user._count.attempts} attempts</span>
              <span>Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Role</TableHead>
              <TableHead className="text-zinc-400">Attempts</TableHead>
              <TableHead className="text-zinc-400">Joined</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-zinc-800 hover:bg-zinc-900/50"
              >
                <TableCell className="text-white font-medium">
                  <div className="flex items-center gap-2">
                    {user.name}
                    {user.isGroupLeader && (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-600/50 text-amber-400"
                      >
                        Leader
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-300">{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.role === "ADMIN"
                        ? "border-amber-500/40 text-amber-400"
                        : "border-zinc-700 text-zinc-400"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {user._count.attempts}
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <ActionButtons user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
