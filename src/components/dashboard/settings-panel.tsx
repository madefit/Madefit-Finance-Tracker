"use client";

import { useState, useTransition } from "react";
import { BellRing, Edit, Plus, ShieldCheck, UserCog, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import type { Employee, NotificationRecipient } from "@/lib/types";
import { createEmployee, updateEmployee } from "@/app/actions/employees";

export function SettingsPanel({ employees, notifications }: { employees: Employee[]; notifications: NotificationRecipient[] }) {
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function testNotification() {
    const res = await fetch("/api/notifications/test", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      alert("Error: " + (json.message || "Unknown error"));
    } else {
      const messages = json.results?.map((r: Record<string, unknown>) => `${r.recipient}: ${r.ok ? 'Success' : 'Failed - ' + String(r.message)}`).join("\n");
      alert("Test results:\n\n" + (messages || "No active recipients found."));
    }
  }

  function handleCreateEmployee(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await createEmployee(formData);
      if (res.error) {
        setMessage(res.error);
      } else {
        setMessage(res.success || "Employee created.");
        setTimeout(() => {
          setIsAddingEmployee(false);
          setMessage(null);
        }, 2000);
      }
    });
  }

  function handleUpdateEmployee(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await updateEmployee(formData);
      if (res.error) {
        setMessage(res.error);
      } else {
        setMessage(res.success || "Employee updated.");
        setTimeout(() => {
          setEditingEmployee(null);
          setMessage(null);
        }, 2000);
      }
    });
  }

  function toggleAdd() {
    setEditingEmployee(null);
    setIsAddingEmployee(!isAddingEmployee);
    setMessage(null);
  }

  function startEdit(employee: Employee) {
    setIsAddingEmployee(false);
    setEditingEmployee(employee);
    setMessage(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
            <UserCog className="h-5 w-5 text-emerald-600" />
            Employees
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={toggleAdd} className="bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50">
            {isAddingEmployee ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isAddingEmployee ? "Cancel" : "Add Employee"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {(isAddingEmployee || editingEmployee) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">{editingEmployee ? "Edit Employee Details" : "New Employee Details"}</h3>
                {editingEmployee && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-200" onClick={() => setEditingEmployee(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <form action={editingEmployee ? handleUpdateEmployee : handleCreateEmployee} className="space-y-4">
                {editingEmployee && <input type="hidden" name="id" value={editingEmployee.id} />}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-slate-600 font-semibold">Full Name</Label>
                    <Input name="full_name" required defaultValue={editingEmployee?.full_name} placeholder="John Doe" className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 bg-white" />
                  </div>
                  <div>
                    <Label className="text-slate-600 font-semibold">Email</Label>
                    <Input name="email" type="email" required defaultValue={editingEmployee?.email} placeholder="john@example.com" className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 bg-white" />
                  </div>
                  <div>
                    <Label className="text-slate-600 font-semibold">Phone (Optional)</Label>
                    <Input name="phone" defaultValue={editingEmployee?.phone || ""} placeholder="+91 90000 00000" className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 bg-white" />
                  </div>
                  <div>
                    <Label className="text-slate-600 font-semibold">Role</Label>
                    <Select name="role" required defaultValue={editingEmployee?.role || "employee"} className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 bg-white">
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </div>
                  
                  {editingEmployee && (
                    <div className="sm:col-span-2">
                      <Label className="text-slate-600 font-semibold">Status</Label>
                      <Select name="is_active" required defaultValue={editingEmployee.is_active ? "true" : "false"} className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 bg-white">
                        <option value="true">Active (Can Login)</option>
                        <option value="false">Disabled (Cannot Login)</option>
                      </Select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <Label className="text-slate-600 font-semibold">{editingEmployee ? "New Password (Optional)" : "Initial Password"}</Label>
                    <Input name="password" type="text" required={!editingEmployee} placeholder={editingEmployee ? "Leave blank to keep unchanged" : "Min 6 characters"} minLength={6} className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 bg-white" />
                    {!editingEmployee && <p className="mt-1.5 text-xs font-medium text-slate-500">Provide this to the employee for their first login.</p>}
                  </div>
                </div>
                {message && (
                  <div className={`rounded-md p-3 text-sm font-medium border ${message.includes("Error") || message.includes("not configured") ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    {message}
                  </div>
                )}
                <Button type="submit" disabled={isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {editingEmployee ? "Save Changes" : "Create Account"}
                </Button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <Table>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th className="font-semibold text-slate-600 py-3">Name</Th>
                  <Th className="font-semibold text-slate-600 py-3">Email</Th>
                  <Th className="font-semibold text-slate-600 py-3">Role</Th>
                  <Th className="font-semibold text-slate-600 py-3">Status</Th>
                  <Th className="font-semibold text-slate-600 py-3">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                    <Td className="font-bold text-slate-900 py-3">{employee.full_name}</Td>
                    <Td className="text-slate-600 py-3">{employee.email}</Td>
                    <Td className="py-3">
                      <Badge tone={employee.role === "admin" ? "blue" : "slate"} className="font-semibold">{employee.role}</Badge>
                    </Td>
                    <Td className="py-3">
                      <Badge tone={employee.is_active ? "green" : "rose"} className="font-semibold">{employee.is_active ? "Active" : "Disabled"}</Badge>
                    </Td>
                    <Td className="py-3">
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => startEdit(employee)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 self-start">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
            <BellRing className="h-5 w-5 text-emerald-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            {notifications.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm font-medium text-slate-500 bg-slate-50">
                No recipients configured yet.
              </div>
            )}
            {notifications.map((recipient) => (
              <div key={recipient.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 bg-slate-50">
                <div>
                  <p className="font-bold text-slate-900">{recipient.recipient_name}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-500">{recipient.channel} · {recipient.destination}</p>
                </div>
                <Badge tone={recipient.is_active ? "green" : "rose"} className="w-fit font-semibold px-3 py-1">{recipient.is_active ? "On" : "Off"}</Badge>
              </div>
            ))}
          </div>

          <Button variant="secondary" className="w-full border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 font-semibold" onClick={testNotification}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Send Test Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


