import AdminSidebar from "@/app/components/AdminSidebar";
import RequireAdmin from "@/app/components/RequireAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </RequireAdmin>
  );
}
