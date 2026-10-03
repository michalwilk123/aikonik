import { redirect } from "next/navigation";

export default function CMSPage() {
  redirect("/admin/collections/submissions");
}
