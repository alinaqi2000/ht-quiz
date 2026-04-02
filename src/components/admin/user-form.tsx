"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "USER"]),
  isGroupLeader: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface UserFormProps {
  defaultValues?: Partial<FormData>;
  userId?: string;
}

export function UserForm({ defaultValues, userId }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!userId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
      isGroupLeader: false,
      ...defaultValues,
    },
  });

  const role = watch("role");
  const isGroupLeader = watch("isGroupLeader");

  async function onSubmit(data: FormData) {
    const body = { ...data };
    if (isEdit && !body.password) {
      delete body.password;
    }

    const res = await fetch(
      isEdit ? `/api/admin/users/${userId}` : "/api/admin/users",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
      return;
    }

    toast.success(isEdit ? "User updated" : "User created");
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-2">
        <Label className="text-slate-300">Name</Label>
        <Input
          {...register("name")}
          placeholder="John Doe"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
        {errors.name && (
          <p className="text-red-400 text-xs">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Email</Label>
        <Input
          {...register("email")}
          type="email"
          placeholder="user@example.com"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
        {errors.email && (
          <p className="text-red-400 text-xs">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">
          Password {isEdit && "(leave blank to keep current)"}
        </Label>
        <Input
          {...register("password")}
          type="password"
          placeholder={isEdit ? "••••••••" : "Min 6 characters"}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
        {errors.password && (
          <p className="text-red-400 text-xs">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Role</Label>
        <Select
          value={role}
          onValueChange={(val) => setValue("role", val as "ADMIN" | "USER")}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="USER" className="text-white">User</SelectItem>
            <SelectItem value="ADMIN" className="text-white">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isGroupLeader"
          checked={isGroupLeader}
          onChange={(e) => setValue("isGroupLeader", e.target.checked)}
          className="w-4 h-4 accent-sky-600"
        />
        <Label htmlFor="isGroupLeader" className="text-slate-300 cursor-pointer">
          Group Leader
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-sky-600 hover:bg-sky-700 text-white"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/users")}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
