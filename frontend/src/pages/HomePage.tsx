import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { APP_MESSAGES, HOME_MESSAGES } from "@/constants";

export function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h4" component="h1" className="font-semibold">
          {HOME_MESSAGES.TITLE}
        </Typography>
        <Typography color="text.secondary" className="mt-1">
          {APP_MESSAGES.TAGLINE}
        </Typography>
      </div>

      <Card>
        <CardContent>
          <Typography color="text.secondary">{HOME_MESSAGES.DESCRIPTION}</Typography>
        </CardContent>
      </Card>
    </div>
  );
}
