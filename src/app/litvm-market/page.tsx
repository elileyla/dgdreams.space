import { redirect } from "next/navigation";

// Predictions lived on LiteVM and were reached from the Tools nav.
// The section was removed, so keep the old URL working and send people to the dashboard.
export default function LitVMPredictionsRedirect() {
  redirect("/dashboard");
}
