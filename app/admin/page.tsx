import type { Metadata } from "next";
import AdminApp from "./AdminApp";

export const metadata: Metadata = { title: "Shri Kalyan Admin" };

export default function Page() {
  return <AdminApp />;
}
