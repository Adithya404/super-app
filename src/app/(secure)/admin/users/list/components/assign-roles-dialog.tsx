"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { F, type Filters } from "@/lib/common/ds/filters";
import type { Roles } from "@/lib/common/ds/types/admin/Roles";
import type { UserRoles } from "@/lib/common/ds/types/admin/UserRoles";
import type { Users } from "@/lib/common/ds/types/admin/Users";

function isRoleActive(endDate?: Date | string | null) {
  if (!endDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) >= today;
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

async function fetchDatasource<T extends object>(datasourceId: string, filters: Filters<T> = []) {
  const queryParams = new URLSearchParams({
    limit: "200",
    offset: "0",
    includeCount: "false",
    filters: JSON.stringify(filters),
  });
  const response = await fetch(`/api/ds/${datasourceId}?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${datasourceId}`);
  }
  const data = await response.json();
  return (data.rows ?? []) as T[];
}

async function saveUserRoles(rows: Record<string, unknown>[]) {
  const response = await fetch("/api/ds/UserRoles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to save user roles");
  }
}

interface AssignRolesDialogProps {
  user: Users;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignRolesDialog({ user, open, onOpenChange }: AssignRolesDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoleCode, setSelectedRoleCode] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDateByRole, setEndDateByRole] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user.email ?? "";

  const { data: userRoles = [], isLoading: loadingUserRoles } = useQuery({
    queryKey: ["user-roles", email],
    queryFn: () => fetchDatasource<UserRoles>("UserRoles", [F.text("email", "is", email)]),
    enabled: open && !!email,
  });

  const { data: allRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["roles-all"],
    queryFn: () => fetchDatasource<Roles>("Roles"),
    enabled: open,
  });

  const activeUserRoles = userRoles.filter((ur) => isRoleActive(ur.endDate));
  const activeRoleCodes = new Set(activeUserRoles.map((ur) => ur.roleCode));

  const availableRoles = allRoles.filter(
    (role) => isRoleActive(role.endDate) && !activeRoleCodes.has(role.roleCode) && role.roleCode,
  );

  const roleNameByCode = Object.fromEntries(allRoles.map((r) => [r.roleCode, r.role]));

  const handleEndRole = async (userRole: UserRoles) => {
    if (!email) return;
    const endDate = endDateByRole[userRole.roleCode] || new Date().toISOString().split("T")[0];
    setSaving(true);
    setError(null);
    try {
      await saveUserRoles([
        {
          email,
          roleCode: userRole.roleCode,
          endDate,
          _status: "U",
          _orig: { email, roleCode: userRole.roleCode },
        },
      ]);
      await queryClient.invalidateQueries({ queryKey: ["user-roles", email] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end role");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async () => {
    if (!email || !selectedRoleCode) return;
    const existingRole = userRoles.find((ur) => ur.roleCode === selectedRoleCode);
    setSaving(true);
    setError(null);
    try {
      if (existingRole) {
        await saveUserRoles([
          {
            email,
            roleCode: selectedRoleCode,
            startDate,
            endDate: null,
            _status: "U",
            _orig: { email, roleCode: selectedRoleCode },
          },
        ]);
      } else {
        await saveUserRoles([
          {
            email,
            roleCode: selectedRoleCode,
            startDate,
            _status: "I",
          },
        ]);
      }
      setSelectedRoleCode("");
      setStartDate(new Date().toISOString().split("T")[0]);
      await queryClient.invalidateQueries({ queryKey: ["user-roles", email] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <section className="space-y-3">
            <h3 className="font-medium text-sm">Current Roles</h3>
            {loadingUserRoles ? (
              <p className="text-muted-foreground text-sm">Loading roles...</p>
            ) : userRoles.length === 0 ? (
              <p className="text-muted-foreground text-sm">No roles assigned.</p>
            ) : (
              <div className="space-y-2">
                {userRoles.map((userRole) => {
                  const active = isRoleActive(userRole.endDate);
                  return (
                    <div
                      key={`${userRole.email}-${userRole.roleCode}`}
                      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end sm:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {roleNameByCode[userRole.roleCode] || userRole.roleCode}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {userRole.roleCode} · Start: {formatDate(userRole.startDate)} · End:{" "}
                          {formatDate(userRole.endDate)}
                          {active ? " · Active" : " · Ended"}
                        </p>
                      </div>
                      {active && (
                        <div className="flex items-end gap-2">
                          <div className="grid gap-1">
                            <Label htmlFor={`end-${userRole.roleCode}`} className="text-xs">
                              End Date
                            </Label>
                            <Input
                              id={`end-${userRole.roleCode}`}
                              type="date"
                              className="h-8"
                              value={
                                endDateByRole[userRole.roleCode] ??
                                new Date().toISOString().split("T")[0]
                              }
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
                            disabled={saving}
                            onClick={() => handleEndRole(userRole)}
                          >
                            End Role
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

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
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="role-select">Role</Label>
                  <Select value={selectedRoleCode} onValueChange={setSelectedRoleCode}>
                    <SelectTrigger id="role-select" className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
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
                  disabled={!selectedRoleCode || saving}
                  onClick={handleAssignRole}
                  className="sm:mb-0.5"
                >
                  Assign
                </Button>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
