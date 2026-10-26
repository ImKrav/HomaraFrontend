import AdminSidebar from "@/app/components/AdminSidebar";
import RequireAdmin from "@/app/components/RequireAdmin";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main id="contenido" tabIndex={-1} className="flex-1 overflow-auto focus:outline-none">{children}</main>
      </div>
    </RequireAdmin>
  );
}
