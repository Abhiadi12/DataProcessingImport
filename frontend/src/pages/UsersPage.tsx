import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageLoader } from "@/components/common/PageLoader";
import { UserDetailsDialog } from "@/components/user/UserDetailsDialog";
import { UsersTable } from "@/components/user/UsersTable";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, ROLE, USERS_MESSAGES } from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useGetUsers, useUpdateUser } from "@/service/user.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { PublicUser, UpdateUserInput } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

export function UsersPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const notify = useNotify();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PublicUser | null>(null);

  const users = useGetUsers({ page: pageIndex + 1, limit: pageSize });
  const updateUser = useUpdateUser();
  const page = users.data?.data;

  const save = (user: PublicUser, input: UpdateUserInput) => {
    updateUser.mutate(
      { id: user.id, input },
      {
        onSuccess: (res) => notify.success(res.message),
        onError: (error) => notify.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleUpdate = (user: PublicUser, input: UpdateUserInput) => {
    if (input.role === ROLE.ADMIN) {
      setPendingPromotion(user);
      return;
    }
    save(user, input);
  };

  const confirmPromotion = () => {
    if (pendingPromotion) {
      save(pendingPromotion, { role: ROLE.ADMIN });
    }
    setPendingPromotion(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h4" component="h1" className="font-semibold">
          {USERS_MESSAGES.TITLE}
        </Typography>
        <Typography color="text.secondary" className="mt-1">
          {USERS_MESSAGES.SUBTITLE}
        </Typography>
      </div>

      {users.isPending && <PageLoader />}
      {users.isError && <Alert severity="error">{getApiErrorMessage(users.error)}</Alert>}

      {page && currentUser && (
        <Card>
          <UsersTable
            users={page.items}
            currentUserId={currentUser.id}
            updatingId={updateUser.isPending ? (updateUser.variables?.id ?? null) : null}
            onView={setViewingId}
            onUpdate={handleUpdate}
            isRefreshing={users.isFetching}
            pagination={{
              page: pageIndex,
              pageSize,
              total: page.total,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              onPageChange: setPageIndex,
              onPageSizeChange: (nextSize) => {
                setPageSize(nextSize);
                setPageIndex(0);
              },
            }}
          />
        </Card>
      )}

      <UserDetailsDialog userId={viewingId} onClose={() => setViewingId(null)} />

      <ConfirmDialog
        open={Boolean(pendingPromotion)}
        title={USERS_MESSAGES.PROMOTE_TITLE}
        description={USERS_MESSAGES.promoteWarning(pendingPromotion?.name ?? "")}
        confirmLabel={USERS_MESSAGES.PROMOTE_CONFIRM}
        onConfirm={confirmPromotion}
        onCancel={() => setPendingPromotion(null)}
      />
    </div>
  );
}
