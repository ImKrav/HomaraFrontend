import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import RequireAuth from "@/app/components/RequireAuth";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <RequireAuth>
        <main className="flex-1">{children}</main>
      </RequireAuth>
      <Footer />
    </>
  );
}
