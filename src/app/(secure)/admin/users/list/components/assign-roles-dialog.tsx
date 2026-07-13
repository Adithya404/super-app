"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateOnly, parseDateLocal, toDateInputValue } from "@/lib/common/date";
import type { Roles } from "@/lib/common/ds/types/admin/Roles";
import type { UserRoles } from "@/lib/common/ds/types/admin/UserRoles";
import type { Users } from "@/lib/common/ds/types/admin/Users";
import {
  type Row,
  type Store,
  useDBRows,
  useIsStoreDirty,
  useIsStoreLoading,
  useIsStorePosting,
  useRows,
  useStore,
} from "@/lib/common/store";

function isRoleActive(endDate?: Date | string | null) {
  if (endDate == null || endDate === "") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  if (Number.isNaN(end.getTime())) return true;
  end.setHours(0, 0, 0, 0);
  return end >= today;
}

function todayInputValue() {
  return toDateInputValue(new Date());
}

function useAssignUserRolesStore(email: string) {
  return useStore<UserRoles>({
    datasourceId: "UserRoles",
    page: "assign-roles",
    alias: `assign-roles-${email}`,
    limit: 200,
    includeCount: false,
    autoQuery: false,
    defaultMatch: email ? { email } : undefined,
  });
}

function useRolesLookupStore() {
  return useStore<Roles>({
    datasourceId: "Roles",
    page: "assign-roles",
    alias: "roles-lookup",
    limit: 500,
    includeCount: false,
    autoQuery: false,
  });
}

interface AssignRolesDialogProps {
  user: Users;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignRolesDialog({ user, open, onOpenChange }: AssignRolesDialogProps) {
  const email = (user.email ?? "").toLowerCase().trim();
  const userRolesStore = useAssignUserRolesStore(email);
  const rolesStore = useRolesLookupStore();

  const userRoles = useRows(userRolesStore);
  const allRoles = useDBRows(rolesStore);
  const loadingUserRoles = useIsStoreLoading(userRolesStore);
  const loadingRoles = useIsStoreLoading(rolesStore);
  const isDirty = useIsStoreDirty(userRolesStore);
  const isPosting = useIsStorePosting(userRolesStore);

  const [selectedRoleCode, setSelectedRoleCode] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState(todayInputValue());
  const [endDateByRole, setEndDateByRole] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Load stores when dialog opens (core pattern: autoQuery false + executeQuery)
  useEffect(() => {
    if (!open || !email) return;
    setError(null);
    setSelectedRoleCode(undefined);
    setStartDate(todayInputValue());
    setEndDateByRole({});
    void userRolesStore.executeQuery?.({
      query: { match: { email }, limit: 200 },
      force: true,
    });
    void rolesStore.executeQuery?.({
      query: { limit: 500 },
      force: true,
    });
  }, [open, email, userRolesStore, rolesStore]);

  const activeRoleCodes = useMemo(() => {
    return new Set(
      userRoles
        .filter((ur) => isRoleActive(ur.endDate))
        .map((ur) => ur.roleCode)
        .filter(Boolean),
    );
  }, [userRoles]);

  const availableRoles = useMemo(() => {
    return allRoles.filter(
      (role) =>
        Boolean(role.roleCode) && isRoleActive(role.endDate) && !activeRoleCodes.has(role.roleCode),
    );
  }, [allRoles, activeRoleCodes]);

  const roleNameByCode = useMemo(() => {
    return Object.fromEntries(allRoles.map((r) => [r.roleCode, r.role]));
  }, [allRoles]);

  const handleClose = () => {
    userRolesStore.resetStore?.();
    onOpenChange(false);
  };

  const handleSave = async () => {
    setError(null);
    const ok = await userRolesStore.save({ feedback: "Roles updated" });
    if (!ok) {
      setError(userRolesStore.error ?? "Failed to save roles");
      return;
    }
    onOpenChange(false);
  };

  const handleEndRole = (userRole: Row<UserRoles>) => {
    const rowId = userRolesStore.rowId?.(userRole);
    if (!rowId) return;
    const endDate = endDateByRole[userRole.roleCode] ?? todayInputValue();
    userRolesStore.setValue(
      "endDate",
      parseDateLocal(endDate) as unknown as UserRoles["endDate"],
      rowId,
    );
  };

  const handleAssignRole = () => {
    if (!email || !selectedRoleCode) return;
    setError(null);

    const existing = userRoles.find((ur) => ur.roleCode === selectedRoleCode);
    if (existing && isRoleActive(existing.endDate)) {
      setError("That role is already active for this user.");
      return;
    }

    if (existing) {
      // Reactivate ended role (same composite PK → update)
      const rowId = userRolesStore.rowId?.(existing);
      if (!rowId) return;
      userRolesStore.setValue(
        "startDate",
        parseDateLocal(startDate) as unknown as UserRoles["startDate"],
        rowId,
      );
      userRolesStore.setValue("endDate", null, rowId);
    } else {
      // Core pattern: insert pending row into store, save later
      userRolesStore.createNew({
        partialRecord: {
          email,
          roleCode: selectedRoleCode,
          startDate: parseDateLocal(startDate),
          endDate: null,
          roleName: roleNameByCode[selectedRoleCode],
        },
      });
    }

    setSelectedRoleCode(undefined);
    setStartDate(todayInputValue());
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Roles — {user.name || user.email}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto px-1 py-2">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {error}
            </p>
          )}

          <CurrentRolesSection
            store={userRolesStore}
            userRoles={userRoles}
            loading={loadingUserRoles}
            roleNameByCode={roleNameByCode}
            endDateByRole={endDateByRole}
            setEndDateByRole={setEndDateByRole}
            onEndRole={handleEndRole}
            disabled={isPosting}
          />

          <section className="space-y-3 border-t pt-4">
            <h3 className="font-medium text-sm">Assign New Role</h3>
            {loadingRoles ? (
              <p className="text-muted-foreground text-sm">Loading available roles...</p>
            ) : availableRoles.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No additional roles available to assign.
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid min-w-0 flex-1 gap-2">
                  <Label htmlFor="role-select">Role</Label>
                  <Select
                    value={selectedRoleCode}
                    onValueChange={(value) => setSelectedRoleCode(value || undefined)}
                  >
                    <SelectTrigger id="role-select" className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-60">
                      {availableRoles.map((role) => (
                        <SelectItem key={role.roleCode} value={role.roleCode}>
                          {role.role} ({role.roleCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    className="h-8"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <Button
                  disabled={!selectedRoleCode || isPosting}
                  onClick={handleAssignRole}
                  className="sm:mb-0.5"
                >
                  Assign
                </Button>
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Assignments and end dates are pending until you click Save.
            </p>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="text-muted-foreground text-xs">
            {isDirty ? "You have unsaved role changes." : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isPosting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPosting || !isDirty}>
              {isPosting ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CurrentRolesSection({
  store,
  userRoles,
  loading,
  roleNameByCode,
  endDateByRole,
  setEndDateByRole,
  onEndRole,
  disabled,
}: {
  store: Store<UserRoles>;
  userRoles: Row<UserRoles>[];
  loading: boolean;
  roleNameByCode: Record<string, string>;
  endDateByRole: Record<string, string>;
  setEndDateByRole: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onEndRole: (userRole: Row<UserRoles>) => void;
  disabled: boolean;
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-medium text-sm">Current Roles</h3>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading roles...</p>
      ) : userRoles.length === 0 ? (
        <p className="text-muted-foreground text-sm">No roles assigned.</p>
      ) : (
        <div className="space-y-2">
          {userRoles.map((userRole) => {
            const rowId = store.rowId?.(userRole) ?? `${userRole.email}-${userRole.roleCode}`;
            const active = isRoleActive(userRole.endDate);
            const pending = userRole._status === "I" || userRole._status === "U";
            const displayName =
              userRole.roleName || roleNameByCode[userRole.roleCode] || userRole.roleCode;

            return (
              <div
                key={rowId}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {displayName}
                    {pending ? (
                      <span className="ml-2 text-amber-600 text-xs dark:text-amber-400">
                        (unsaved)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {userRole.roleCode} · Start: {formatDateOnly(userRole.startDate)} · End:{" "}
                    {formatDateOnly(userRole.endDate)}
                    {active ? " · Active" : " · Ended"}
                  </p>
                </div>
                {active && userRole._status !== "I" && (
                  <div className="flex items-end gap-2">
                    <div className="grid gap-1">
                      <Label htmlFor={`end-${rowId}`} className="text-xs">
                        End Date
                      </Label>
                      <Input
                        id={`end-${rowId}`}
                        type="date"
                        className="h-8"
                        value={endDateByRole[userRole.roleCode] ?? todayInputValue()}
                        onChange={(e) =>
                          setEndDateByRole((prev) => ({
                            ...prev,
                            [userRole.roleCode]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => onEndRole(userRole)}
                    >
                      End Role
                    </Button>
                  </div>
                )}
                {userRole._status === "I" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => {
                      const id = store.rowId?.(userRole);
                      if (id) void store.deleteRow?.(id);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
