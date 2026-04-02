import { AdminHeader } from "@/components/admin/header";
import { UserForm } from "@/components/admin/user-form";

export default function NewUserPage() {
  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Create User"
        description="Add a new user to the platform"
      />
      <div className="p-6">
        <UserForm />
      </div>
    </div>
  );
}
