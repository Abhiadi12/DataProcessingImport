import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { StatCardProps } from "@/types";

const TONE_CLASS: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "",
  success: "text-green-700",
  error: "text-red-700",
  warning: "text-amber-700",
};

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <Card className="p-4">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" component="p" className={`mt-1 font-semibold ${TONE_CLASS[tone]}`}>
        {value}
      </Typography>
    </Card>
  );
}
