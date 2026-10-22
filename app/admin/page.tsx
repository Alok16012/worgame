import type { Metadata } from "next";
import AdminApp from "./AdminApp";

export const metadata: Metadata = { title: "Triviaverse Admin" };

export default function Page() {
  return <AdminApp />;
}
