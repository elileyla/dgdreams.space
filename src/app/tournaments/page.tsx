import { redirect } from "next/navigation";

// Tournaments lived inside the LiteVM Hub and were played on the 2048 page.
// Both are gone, so keep the old URL working and send people to the dashboard.
export default function TournamentsRedirect() {
  redirect("/dashboard");
}