import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { PageLoader } from "@/components/common/PageLoader";
import { ChangePasswordForm } from "@/components/user/ChangePasswordForm";
import { DetailRow } from "@/components/user/DetailRow";
import { ProfileForm } from "@/components/user/ProfileForm";
import { RoleChip } from "@/components/user/RoleChip";
import { PROFILE_MESSAGES } from "@/constants";
import { useGetMe } from "@/service/user.service";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDate } from "@/utils/format";

export function ProfilePage() {
  const { data, isPending, isError, error } = useGetMe();
  const user = data?.data;

  if (isPending) {
    return <PageLoader />;
  }

  if (isError || !user) {
    return <Alert severity="error">{getApiErrorMessage(error)}</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h4" component="h1" className="font-semibold">
          {PROFILE_MESSAGES.TITLE}
        </Typography>
        <Typography color="text.secondary" className="mt-1">
          {PROFILE_MESSAGES.SUBTITLE}
        </Typography>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <Typography variant="h6" component="h2">
              {PROFILE_MESSAGES.DETAILS_TITLE}
            </Typography>
            <ProfileForm user={user} />
            <div className="divide-y divide-slate-200 border-t border-slate-200">
              <DetailRow label={PROFILE_MESSAGES.ROLE}>
                <RoleChip role={user.role} />
              </DetailRow>
              <DetailRow label={PROFILE_MESSAGES.MEMBER_SINCE}>
                {formatDate(user.createdAt)}
              </DetailRow>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div>
              <Typography variant="h6" component="h2">
                {PROFILE_MESSAGES.PASSWORD_TITLE}
              </Typography>
              <Typography variant="body2" color="text.secondary" className="mt-1">
                {PROFILE_MESSAGES.PASSWORD_HINT}
              </Typography>
            </div>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
