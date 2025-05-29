import { Toaster } from "react-hot-toast";
import { Navbar } from "./components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">{children}</main>
      <Toaster position="top-right" />
    </>
  );
}
