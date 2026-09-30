import type { Metadata } from "next";
import AdminApp from "./AdminApp";

export const metadata: Metadata = { title: "Word Game Admin" };

export default function Page() {
  return <AdminApp />;
}
