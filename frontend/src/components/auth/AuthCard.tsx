import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { APP_MESSAGES } from "@/constants";
import type { AuthCardProps } from "@/types";

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-6">
          <div>
            <Typography variant="overline" color="primary">
              {APP_MESSAGES.NAME}
            </Typography>
            <Typography variant="h5" component="h1" className="font-semibold">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              {subtitle}
            </Typography>
          </div>

          {children}

          <Typography variant="body2" color="text.secondary" className="text-center">
            {footer}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
