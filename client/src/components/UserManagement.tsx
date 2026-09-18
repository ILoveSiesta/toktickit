import React, { useState, useEffect, useMemo } from "react";
import { AdminUser, Role } from "../types/index.js";
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();

  // User List State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createName, setCreateName] = useState<string>("");
  const [createEmail, setCreateEmail] = useState<string>("");
  const [createRole, setCreateRole] = useState<Role>("REQUESTER");
  const [createDept, setCreateDept] = useState<string>("");
  const [createIsActive, setCreateIsActive] = useState<boolean>(true);
  const [createPassword, setCreatePassword] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editRole, setEditRole] = useState<Role>("REQUESTER");
  const [editDept, setEditDept] = useState<string>("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Reset Password Modal State
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [newInitialPassword, setNewInitialPassword] = useState<string>("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // Deactivate Confirmation Modal State
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  const [isSubmittingDeactivate, setIsSubmittingDeactivate] = useState<boolean>(false);

  // Global Notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params: { search?: string; role?: string } = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (roleFilter !== "ALL") params.role = roleFilter;
      const data = await fetchAdminUsers(params);
      setUsers(data);
    } catch (err: any) {
      setFetchError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDept(user.department || "");
    setEditIsActive(user.isActive);
    setEditError(null);
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createName.trim() || createName.trim().length < 2) {
      setCreateError("Name must be at least 2 characters long.");
      return;
    }
    if (!createEmail.trim() || !createEmail.includes("@")) {
      setCreateError("Please enter a valid email address.");
      return;
    }
    if (!createPassword || createPassword.length < 8) {
      setCreateError("Initial password must be at least 8 characters long.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const newUser = await createAdminUser({
        name: createName.trim(),
        email: createEmail.trim(),
        role: createRole,
        department: createDept.trim() || null,
        isActive: createIsActive,
        initialPassword: createPassword,
      });

      setIsCreateModalOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreateRole("REQUESTER");
      setCreateDept("");
      setCreateIsActive(true);
      setCreatePassword("");
      showSuccess(`User ${newUser.name} created successfully.`);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    if (!editName.trim() || editName.trim().length < 2) {
      setEditError("Name must be at least 2 characters long.");
      return;
    }
    if (!editEmail.trim() || !editEmail.includes("@")) {
      setEditError("Please enter a valid email address.");
      return;
    }

    // UI Guardrail: prevent self-deactivation (BR-25)
    if (editingUser.id === currentUser?.id && !editIsActive) {
      setEditError("You cannot deactivate your own administrator account.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await updateAdminUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        department: editDept.trim() || null,
        isActive: editIsActive,
      });

      setEditingUser(null);
      showSuccess(`User ${editName} updated successfully.`);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit Deactivate User
  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser) return;

    if (deactivatingUser.id === currentUser?.id) {
      alert("You cannot deactivate your own administrator account.");
      setDeactivatingUser(null);
      return;
    }

    setIsSubmittingDeactivate(true);
    try {
      await updateAdminUser(deactivatingUser.id, { isActive: false });
      setDeactivatingUser(null);
      if (editingUser?.id === deactivatingUser.id) {
        setEditingUser(null);
      }
      showSuccess(`User ${deactivatingUser.name} has been deactivated.`);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate user.");
    } finally {
      setIsSubmittingDeactivate(false);
    }
  };

  // Submit Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);

    if (!newInitialPassword || newInitialPassword.length < 8) {
      setResetError("Initial password must be at least 8 characters long.");
      return;
    }

    setIsSubmittingReset(true);
    try {
      await resetAdminUserPassword(resetTargetUser.id, newInitialPassword);
      setResetTargetUser(null);
      setNewInitialPassword("");
      showSuccess(`Initial password reset successfully for ${resetTargetUser.name}.`);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Badge Styles
  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case "REQUESTER":
        return { backgroundColor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" };
      case "IT_STAFF":
        return { backgroundColor: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC" };
      case "ADMINISTRATOR":
        return { backgroundColor: "#EDE9FE", color: "#6D28D9", border: "1px solid #DDD6FE" };
    }
  };

  const getStatusBadgeStyle = (isActive: boolean) => {
    return isActive
      ? { backgroundColor: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC" }
      : { backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FCA5A5" };
  };

  const isEditingSelf = editingUser && currentUser && editingUser.id === currentUser.id;

  return (
    <div className="zen-container" style={{ padding: "var(--space-lg) var(--space-base)" }}>
      {/* Toast Notification */}
      {successMessage && (
        <div
          data-testid="success-toast"
          style={{
            backgroundColor: "#DCFCE7",
            color: "#15803D",
            border: "1px solid #86EFAC",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            marginBottom: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            fontWeight: 500,
          }}
        >
          <span>✓</span> {successMessage}
        </div>
      )}

      {/* Header with Title and Create Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Users
          </h1>
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Manage TokTickIT user accounts, roles, activation status, and credentials.
          </p>
        </div>

        <button
          type="button"
          data-testid="create-user-btn"
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="zen-btn zen-btn-primary"
          style={{
            backgroundColor: "var(--color-primary-green)",
            color: "#FFFFFF",
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 600,
          }}
        >
          <span>+</span> Create User
        </button>
      </div>

      {/* Toolbar: Search and Filter */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border-neutral)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-md)",
          marginBottom: "var(--space-md)",
          display: "flex",
          gap: "var(--space-md)",
          flexWrap: "wrap",
          alignItems: "center",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ flex: "1 1 280px", position: "relative" }}>
          <input
            type="text"
            data-testid="user-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..."
            className="zen-input"
            style={{ width: "100%", paddingLeft: "12px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          <label
            htmlFor="role-filter"
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-primary)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Filter by Role:
          </label>
          <select
            id="role-filter"
            data-testid="role-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="zen-select"
            style={{ minWidth: "170px" }}
          >
            <option value="ALL">All Roles</option>
            <option value="REQUESTER">Requester</option>
            <option value="IT_STAFF">IT Staff</option>
            <option value="ADMINISTRATOR">Administrator</option>
          </select>
        </div>

        {(searchTerm || roleFilter !== "ALL") && (
          <button
            type="button"
            data-testid="clear-filters-btn"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("ALL");
            }}
            className="zen-btn zen-btn-secondary"
            style={{ fontSize: "var(--font-size-xs)", padding: "6px 10px" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="zen-alert-error" role="alert" style={{ marginBottom: "var(--space-md)" }}>
          {fetchError}
        </div>
      )}

      {/* Table Container */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border-neutral)",
          borderRadius: "var(--radius-md)",
          overflowX: "auto",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {loading ? (
          <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
            <div
              className="zen-spinner"
              style={{ width: 32, height: 32, margin: "0 auto var(--space-sm)" }}
            />
            <div style={{ color: "var(--color-text-muted)" }}>Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
              {searchTerm || roleFilter !== "ALL"
                ? "No users matching criteria."
                : "No users found in the system."}
            </p>
            {(searchTerm || roleFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("ALL");
                }}
                className="zen-btn zen-btn-secondary"
                style={{ marginTop: "var(--space-xs)" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table
            data-testid="users-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "var(--font-size-sm)",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--color-page-bg)",
                  borderBottom: "1px solid var(--color-border-neutral)",
                  color: "var(--color-text-muted)",
                }}
              >
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Email</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  data-testid={`user-row-${user.id}`}
                  style={{
                    borderBottom: "1px solid var(--color-border-neutral)",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--color-pale-green)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      data-testid={`user-name-${user.id}`}
                      style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
                    >
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span
                          style={{
                            marginLeft: "6px",
                            fontSize: "10px",
                            backgroundColor: "#E2E8F0",
                            color: "#475569",
                            padding: "2px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    {user.department && (
                      <div
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {user.department}
                      </div>
                    )}
                  </td>
                  <td
                    data-testid={`user-email-${user.id}`}
                    style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}
                  >
                    {user.email}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      data-testid={`user-role-${user.id}`}
                      style={{
                        ...getRoleBadgeStyle(user.role),
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "inline-block",
                      }}
                    >
                      {user.role === "IT_STAFF"
                        ? "IT Staff"
                        : user.role === "ADMINISTRATOR"
                        ? "Administrator"
                        : "Requester"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      data-testid={`user-status-${user.id}`}
                      style={{
                        ...getStatusBadgeStyle(user.isActive),
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "inline-block",
                      }}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      type="button"
                      data-testid={`edit-user-btn-${user.id}`}
                      onClick={() => handleOpenEdit(user)}
                      className="zen-btn zen-btn-secondary"
                      style={{
                        padding: "4px 10px",
                        fontSize: "var(--font-size-xs)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: Create New User */}
      {isCreateModalOpen && (
        <div
          data-testid="create-user-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-md)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-md)",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border-neutral)",
                backgroundColor: "var(--color-page-bg)",
              }}
            >
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Create New User</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: "20px" }}>
              {createError && (
                <div
                  data-testid="create-error-alert"
                  className="zen-alert-error"
                  role="alert"
                  style={{ marginBottom: "var(--space-md)" }}
                >
                  {createError}
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="create-name"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Full Name *
                </label>
                <input
                  id="create-name"
                  type="text"
                  data-testid="create-user-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Alex Thompson"
                  className="zen-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="create-email"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Email Address *
                </label>
                <input
                  id="create-email"
                  type="email"
                  data-testid="create-user-email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="e.g. alex.thompson@toktickit.com"
                  className="zen-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="create-role"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Role *
                </label>
                <select
                  id="create-role"
                  data-testid="create-user-role"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as Role)}
                  className="zen-select"
                  style={{ width: "100%" }}
                  required
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="create-dept"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Department (Optional)
                </label>
                <input
                  id="create-dept"
                  type="text"
                  data-testid="create-user-dept"
                  value={createDept}
                  onChange={(e) => setCreateDept(e.target.value)}
                  placeholder="e.g. Technical Support"
                  className="zen-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="create-password"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Initial Password *
                </label>
                <input
                  id="create-password"
                  type="password"
                  data-testid="create-user-password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="zen-input"
                  style={{ width: "100%" }}
                  required
                />
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    marginTop: "4px",
                  }}
                >
                  ℹ️ User will be required to change this password on first login (BR-24).
                </span>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid="create-user-active"
                    checked={createIsActive}
                    onChange={(e) => setCreateIsActive(e.target.checked)}
                  />
                  Active (User can sign in)
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-sm)",
                  marginTop: "var(--space-md)",
                }}
              >
                <button
                  type="button"
                  data-testid="cancel-create-user-btn"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="zen-btn zen-btn-secondary"
                  disabled={isSubmittingCreate}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-create-user-btn"
                  className="zen-btn zen-btn-primary"
                  disabled={isSubmittingCreate}
                  style={{
                    backgroundColor: "var(--color-primary-green)",
                    color: "#FFFFFF",
                  }}
                >
                  {isSubmittingCreate ? "Creating..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User */}
      {editingUser && (
        <div
          data-testid="edit-user-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-md)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-md)",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border-neutral)",
                backgroundColor: "var(--color-page-bg)",
              }}
            >
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                Edit User: {editingUser.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: "20px" }}>
              {editError && (
                <div
                  data-testid="edit-error-alert"
                  className="zen-alert-error"
                  role="alert"
                  style={{ marginBottom: "var(--space-md)" }}
                >
                  {editError}
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="edit-name"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Full Name *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  data-testid="edit-user-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="zen-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="edit-email"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Email Address *
                </label>
                <input
                  id="edit-email"
                  type="email"
                  data-testid="edit-user-email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="zen-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="edit-role"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Role *
                </label>
                <select
                  id="edit-role"
                  data-testid="edit-user-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="zen-select"
                  style={{ width: "100%" }}
                  required
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="edit-dept"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Department
                </label>
                <input
                  id="edit-dept"
                  type="text"
                  data-testid="edit-user-dept"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="zen-input"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Status Switch with BR-25 Guardrail */}
              <div
                style={{
                  marginBottom: "16px",
                  backgroundColor: "var(--color-page-bg)",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: isEditingSelf ? "not-allowed" : "pointer",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: isEditingSelf ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid="edit-user-active"
                    checked={editIsActive}
                    disabled={Boolean(isEditingSelf)}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  Active Account
                </label>

                {isEditingSelf && (
                  <div
                    data-testid="self-deactivation-warning"
                    style={{
                      fontSize: "12px",
                      color: "#B45309",
                      marginTop: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ⚠️ You cannot deactivate your own administrator account (BR-25).
                  </div>
                )}
              </div>

              {/* Action Buttons: Reset Password & Deactivate Action */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--space-xs)",
                  paddingTop: "var(--space-sm)",
                  borderTop: "1px solid var(--color-border-neutral)",
                }}
              >
                <div>
                  <button
                    type="button"
                    data-testid="reset-password-btn"
                    onClick={() => {
                      setResetTargetUser(editingUser);
                      setNewInitialPassword("");
                      setResetError(null);
                    }}
                    className="zen-btn zen-btn-secondary"
                    style={{ fontSize: "var(--font-size-xs)" }}
                  >
                    🔑 Reset Password
                  </button>
                </div>

                <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                  {!isEditingSelf && editingUser.isActive && (
                    <button
                      type="button"
                      data-testid="deactivate-user-btn"
                      onClick={() => setDeactivatingUser(editingUser)}
                      className="zen-btn zen-btn-secondary"
                      style={{
                        borderColor: "var(--color-error)",
                        color: "var(--color-error)",
                        fontSize: "var(--font-size-xs)",
                      }}
                    >
                      Deactivate
                    </button>
                  )}

                  {isEditingSelf && (
                    <button
                      type="button"
                      data-testid="deactivate-user-btn"
                      disabled={true}
                      className="zen-btn zen-btn-secondary"
                      style={{
                        opacity: 0.5,
                        cursor: "not-allowed",
                        fontSize: "var(--font-size-xs)",
                      }}
                      title="You cannot deactivate your own account"
                    >
                      Deactivate
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="cancel-edit-user-btn"
                    onClick={() => setEditingUser(null)}
                    className="zen-btn zen-btn-secondary"
                    disabled={isSubmittingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-edit-user-btn"
                    className="zen-btn zen-btn-primary"
                    disabled={isSubmittingEdit}
                    style={{
                      backgroundColor: "var(--color-primary-green)",
                      color: "#FFFFFF",
                    }}
                  >
                    {isSubmittingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Initial Password */}
      {resetTargetUser && (
        <div
          data-testid="reset-password-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-md)",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-md)",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "var(--shadow-lg)",
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px 0" }}>
              Reset Initial Password
            </h3>
            <p
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-muted)",
                marginBottom: "16px",
              }}
            >
              Set a new initial password for <strong>{resetTargetUser.name}</strong> ({resetTargetUser.email}).
              The user will be required to change it at next login (BR-24).
            </p>

            <form onSubmit={handleResetPasswordSubmit}>
              {resetError && (
                <div
                  data-testid="reset-error-alert"
                  className="zen-alert-error"
                  role="alert"
                  style={{ marginBottom: "var(--space-md)" }}
                >
                  {resetError}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="new-initial-pass"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  New Initial Password *
                </label>
                <input
                  id="new-initial-pass"
                  type="password"
                  data-testid="new-initial-password-input"
                  value={newInitialPassword}
                  onChange={(e) => setNewInitialPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="zen-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-sm)",
                }}
              >
                <button
                  type="button"
                  data-testid="cancel-reset-password-btn"
                  onClick={() => setResetTargetUser(null)}
                  className="zen-btn zen-btn-secondary"
                  disabled={isSubmittingReset}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="confirm-reset-password-btn"
                  className="zen-btn zen-btn-primary"
                  disabled={isSubmittingReset}
                  style={{
                    backgroundColor: "var(--color-primary-green)",
                    color: "#FFFFFF",
                  }}
                >
                  {isSubmittingReset ? "Resetting..." : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Deactivation */}
      {deactivatingUser && (
        <div
          data-testid="confirm-deactivate-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-md)",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-md)",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "var(--shadow-lg)",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                margin: "0 0 8px 0",
                color: "var(--color-error)",
              }}
            >
              Deactivate User Account
            </h3>
            <p
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-primary)",
                marginBottom: "16px",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to deactivate <strong>{deactivatingUser.name}</strong>?
              They will no longer be able to log in to TokTickIT.
            </p>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-page-bg)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                marginBottom: "20px",
              }}
            >
              🔒 <strong>Soft Deactivation:</strong> Historical data and submitted tickets will be
              preserved. No hard deletion occurs (BR-27).
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-sm)" }}>
              <button
                type="button"
                data-testid="cancel-confirm-deactivate-btn"
                onClick={() => setDeactivatingUser(null)}
                className="zen-btn zen-btn-secondary"
                disabled={isSubmittingDeactivate}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-deactivate-btn"
                onClick={handleConfirmDeactivate}
                className="zen-btn"
                disabled={isSubmittingDeactivate}
                style={{
                  backgroundColor: "var(--color-error)",
                  color: "#FFFFFF",
                  border: "none",
                }}
              >
                {isSubmittingDeactivate ? "Deactivating..." : "Deactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
