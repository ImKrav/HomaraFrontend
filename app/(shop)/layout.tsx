import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import RequireAuth from "@/app/components/RequireAuth";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <RequireAuth>
        <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      </RequireAuth>
      <Footer />
    </>
  );
}
