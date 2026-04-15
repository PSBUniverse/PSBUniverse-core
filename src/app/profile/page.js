"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "@/core/auth/useAuth";
import { getSupabase } from "@/core/supabase/client";
import { toastError, toastInfo, toastSuccess } from "@/shared/utils/toast";

const INACTIVE_STATUS_HINTS = [
  "inactive",
  "disabled",
  "suspended",
  "locked",
  "deleted",
  "blocked",
  "archived",
];
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_NUMBER_OR_SYMBOL_REGEX = /[^A-Za-z]/;

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getLabel(record, preferredFields = []) {
  const candidates = [
    ...preferredFields,
    "sts_name",
    "comp_name",
    "dept_name",
    "status_name",
    "name",
    "label",
    "code",
    "title",
    "description",
  ];

  for (const field of candidates) {
    const value = record?.[field];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "(Unnamed)";
}

function buildInitials(firstName, lastName, username) {
  const first = String(firstName || "").trim().charAt(0);
  const last = String(lastName || "").trim().charAt(0);

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return String(username || "U").trim().charAt(0).toUpperCase() || "U";
}

function statusIsActive(statusLabel, statusRecord) {
  if (statusRecord?.is_active === false) {
    return false;
  }

  const normalized = String(statusLabel || "").trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return !INACTIVE_STATUS_HINTS.some((keyword) => normalized.includes(keyword));
}

function buildRequestUpdateMailto(adminEmail, username) {
  if (!hasText(adminEmail)) {
    return "";
  }

  const subject = encodeURIComponent(`Profile update request - ${String(username || "user").trim()}`);
  const body = encodeURIComponent(["Hi,", "", "Please help update my profile details:", "-", "", "Thanks."].join("\n"));

  return `mailto:${adminEmail}?subject=${subject}&body=${body}`;
}

export default function ProfilePage() {
  const { dbUser, authUser, roles, loading } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const profile = useMemo(() => {
    const usernameFromDb = String(dbUser?.username || "").trim();
    const usernameFromMeta = String(authUser?.user_metadata?.username || "").trim();
    const usernameFromEmail = String(dbUser?.email || authUser?.email || "").split("@")[0] || "";

    return {
      username: usernameFromDb || usernameFromMeta || usernameFromEmail,
      email: String(dbUser?.email || authUser?.email || "").trim(),
      first_name: String(dbUser?.first_name || authUser?.user_metadata?.first_name || "").trim(),
      last_name: String(dbUser?.last_name || authUser?.user_metadata?.last_name || "").trim(),
      phone: String(dbUser?.phone || "").trim(),
      address: String(dbUser?.address || "").trim(),
      comp_id: dbUser?.comp_id,
      dept_id: dbUser?.dept_id,
      status_id: dbUser?.status_id,
    };
  }, [authUser, dbUser]);

  const relations = useMemo(
    () => ({
      company: dbUser
        ? {
            comp_name: dbUser.comp_name,
            company_name: dbUser.company_name,
            comp_email: dbUser.comp_email,
          }
        : null,
      department: dbUser
        ? {
            dept_name: dbUser.dept_name,
            department_name: dbUser.department_name,
          }
        : null,
      status: dbUser
        ? {
            sts_name: dbUser.sts_name,
            status_name: dbUser.status_name,
            is_active: dbUser.status_is_active,
          }
        : null,
    }),
    [dbUser],
  );

  const companyLabel = useMemo(() => {
    if (relations?.company) return getLabel(relations.company, ["comp_name", "company_name"]);
    return "No company assigned";
  }, [relations]);

  const departmentLabel = useMemo(() => {
    if (relations?.department) {
      return getLabel(relations.department, ["dept_name", "department_name"]);
    }
    return "No department assigned";
  }, [relations]);

  const statusLabel = useMemo(() => {
    if (relations?.status) return getLabel(relations.status, ["sts_name", "status_name"]);
    return "No status assigned";
  }, [relations]);

  const fullName = useMemo(() => {
    const first = String(profile.first_name || "").trim();
    const last = String(profile.last_name || "").trim();

    if (first || last) {
      return `${first} ${last}`.trim();
    }

    return profile.username || profile.email || "User";
  }, [profile.email, profile.first_name, profile.last_name, profile.username]);

  const initials = useMemo(() => {
    return buildInitials(profile.first_name, profile.last_name, profile.username);
  }, [profile.first_name, profile.last_name, profile.username]);

  const adminEmail = useMemo(() => {
    const companyEmail = String(relations?.company?.comp_email || "").trim();
    return companyEmail || "";
  }, [relations]);

  const isActive = useMemo(() => {
    return statusIsActive(statusLabel, relations?.status);
  }, [relations?.status, statusLabel]);

  const roleGroupsByApp = useMemo(() => {
    const groupMap = new Map();

    (Array.isArray(roles) ? roles : []).forEach((roleRow) => {
      const appId = String(roleRow?.app_id || "").trim();
      const roleId = String(roleRow?.role_id || "").trim();
      const roleName = String(roleRow?.role_name || `Role ${roleId || "-"}`).trim();
      const appName = String(roleRow?.app_name || (appId ? `App ${appId}` : "Application")).trim();

      if (!roleName) {
        return;
      }

      const groupKey = `${appId}:${appName.toLowerCase()}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          appId,
          appName,
          roles: [],
        });
      }

      const group = groupMap.get(groupKey);
      const alreadyExists = group.roles.some(
        (entry) => entry.roleId === roleId || entry.roleName.toLowerCase() === roleName.toLowerCase(),
      );

      if (!alreadyExists) {
        group.roles.push({
          roleId,
          roleName,
        });
      }
    });

    return Array.from(groupMap.values())
      .map((group) => ({
        ...group,
        roles: group.roles.sort((left, right) => left.roleName.localeCompare(right.roleName)),
      }))
      .sort((left, right) => left.appName.localeCompare(right.appName));
  }, [roles]);

  const requestUpdateHref = useMemo(() => {
    return buildRequestUpdateMailto(adminEmail, profile.username);
  }, [adminEmail, profile.username]);

  const hasAccess = roleGroupsByApp.length > 0;

  const copyToClipboard = useCallback(async (value, label) => {
    const text = String(value || "").trim();
    if (!text) {
      toastInfo(`${label} is not available to copy.`, "User Profile");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toastSuccess(`${label} copied.`, "User Profile");
    } catch {
      toastError(`Unable to copy ${label.toLowerCase()}.`, "User Profile");
    }
  }, []);

  const resetPasswordModal = useCallback(() => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordError("");
    setPasswordSubmitting(false);
  }, []);

  const openPasswordModal = useCallback(() => {
    resetPasswordModal();
    setShowPasswordModal(true);
  }, [resetPasswordModal]);

  const closePasswordModal = useCallback(() => {
    if (passwordSubmitting) return;
    setShowPasswordModal(false);
    resetPasswordModal();
  }, [passwordSubmitting, resetPasswordModal]);

  const submitPasswordUpdate = useCallback(
    async (event) => {
      event.preventDefault();
      if (passwordSubmitting) return;

      const nextPassword = String(newPassword || "");
      const nextConfirm = String(confirmPassword || "");

      if (!nextPassword.trim() || !nextConfirm.trim()) {
        setPasswordError("Password is required");
        return;
      }

      if (nextPassword.length < MIN_PASSWORD_LENGTH) {
        setPasswordError("Password must be at least 8 characters");
        return;
      }

      if (!PASSWORD_NUMBER_OR_SYMBOL_REGEX.test(nextPassword)) {
        setPasswordError("Password must include at least one number or symbol");
        return;
      }

      if (nextPassword !== nextConfirm) {
        setPasswordError("Passwords do not match");
        return;
      }

      setPasswordError("");
      setPasswordSubmitting(true);

      try {
        const supabase = getSupabase();
        const { error } = await supabase.auth.updateUser({ password: nextPassword });

        if (error) {
          setPasswordError(error.message || "Unable to update password right now");
          return;
        }

        toastSuccess("Password updated successfully", "User Profile");
        setShowPasswordModal(false);
        resetPasswordModal();
      } catch (error) {
        setPasswordError(error?.message || "Unable to update password right now");
      } finally {
        setPasswordSubmitting(false);
      }
    },
    [confirmPassword, newPassword, passwordSubmitting, resetPasswordModal],
  );

  const renderValue = useCallback(
    (value, options = {}) => {
      const text = String(value || "").trim();

      if (text) {
        if (options.type === "email") {
          return (
            <a href={`mailto:${text}`} className="profile-inline-link">
              {text}
            </a>
          );
        }

        return <span>{text}</span>;
      }

      return (
        <span className="profile-empty-value">
          <span className="profile-empty-icon" aria-hidden="true">
            i
          </span>
          <span>Not available</span>
          {requestUpdateHref ? (
            <a href={requestUpdateHref} className="profile-empty-action-link">
              Request update
            </a>
          ) : null}
        </span>
      );
    },
    [requestUpdateHref],
  );

  if (loading) {
    return <Container className="py-4">Loading profile...</Container>;
  }

  return (
    <Container className="py-4 profile-page-shell" style={{ maxWidth: 1120 }}>
      <div className="mb-3">
        <h2 className="mb-0">User Profile</h2>
        <p className="text-muted mb-0">Profile view for your account.</p>
      </div>

      <div className="profile-readonly-alert notice-banner notice-banner-info mb-3">
        Profile field updates are managed by administrators.
        You can update your password below.
      </div>

      {!hasAccess ? (
        <div className="notice-banner notice-banner-warning mb-3">
          Your account currently has no active app assignments.
        </div>
      ) : null}

      <Row className="g-3 align-items-start">
        <Col lg={4} className="profile-social-col">
          <Card className="profile-social-card border-0 shadow-sm">
            <Card.Body className="profile-social-card-body">
              <div className="profile-card-actions">
                {requestUpdateHref ? (
                  <Button as="a" href={requestUpdateHref} size="sm" className="profile-action-primary">
                    Request Update
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => void copyToClipboard(profile.email, "Email")}
                >
                  Copy Email
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => void copyToClipboard(profile.username, "Username")}
                >
                  Copy Username
                </Button>
              </div>

              <div className="profile-social-content">
                <div className="profile-avatar">{initials}</div>
                <h3 className="profile-name mb-1 text-center">{fullName}</h3>
                <p className="profile-handle mb-2 text-center">@{String(profile.username || "unknown")}</p>
                <Badge
                  bg="light"
                  text="dark"
                  className={`profile-status-badge ${isActive ? "status-active" : "status-inactive"}`}
                >
                  <span className="profile-status-indicator" aria-hidden="true" />
                  <span>{isActive ? "Active" : "Inactive"}</span>
                </Badge>

                <div className="profile-org-lines mt-3 text-center">
                  <p className="mb-1">{companyLabel}</p>
                  <p className="mb-0">{departmentLabel}</p>
                </div>

                {hasText(adminEmail) ? (
                  <div className="profile-admin-contact mt-3 text-center">
                    <p className="mb-1 text-muted">Administrator Contact</p>
                    <a href={`mailto:${adminEmail}`} className="profile-admin-link">
                      {adminEmail}
                    </a>
                  </div>
                ) : null}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="profile-summary-card border-0 shadow-sm mb-3">
            <Card.Body className="profile-summary-card-body">
              <p className="profile-section-kicker mb-1">My PSB</p>
              <h4 className="mb-1">Profile Snapshot</h4>
              <p className="text-muted mb-2">Your account details are visible here for quick reference.</p>

              <div className="profile-roles-panel mb-2">
                <p className="profile-detail-label mb-1">Roles</p>
                {roleGroupsByApp.length > 0 ? (
                  <div className="profile-role-groups">
                    {roleGroupsByApp.map((group) => (
                      <div key={`role-group-${group.appId || group.appName}`} className="profile-role-group-card">
                        <p className="profile-role-app-name mb-1">{group.appName}</p>
                        <div className="profile-role-pills">
                          {group.roles.map((role) => (
                            <Badge
                              key={`role-pill-${group.appId}-${role.roleId || role.roleName}`}
                              className="profile-role-pill"
                              bg="light"
                              text="dark"
                            >
                              {role.roleName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-value profile-empty-roles">
                    <span className="profile-empty-icon" aria-hidden="true">
                      i
                    </span>
                    <span>No roles assigned</span>
                  </div>
                )}
              </div>

              <Row className="g-2 profile-info-grid">
                <Col sm={6}>
                  <div className="profile-detail-tile" tabIndex={0}>
                    <p className="profile-detail-label mb-1">Email</p>
                    <p className="profile-detail-value mb-0">{renderValue(profile.email, { type: "email" })}</p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="profile-detail-tile" tabIndex={0}>
                    <p className="profile-detail-label mb-1">Phone</p>
                    <p className="profile-detail-value mb-0">{renderValue(profile.phone)}</p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="profile-detail-tile" tabIndex={0}>
                    <p className="profile-detail-label mb-1">Address</p>
                    <p className="profile-detail-value mb-0">{renderValue(profile.address)}</p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="profile-detail-tile" tabIndex={0}>
                    <p className="profile-detail-label mb-1">Username</p>
                    <p className="profile-detail-value mb-0 d-flex align-items-center justify-content-between gap-2">
                      <span>{String(profile.username || "unknown")}</span>
                      <button
                        type="button"
                        className="profile-mini-copy"
                        onClick={() => void copyToClipboard(profile.username, "Username")}
                      >
                        Copy
                      </button>
                    </p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="profile-detail-tile" tabIndex={0}>
                    <p className="profile-detail-label mb-1">Company</p>
                    <p className="profile-detail-value mb-0">{companyLabel}</p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="profile-detail-tile" tabIndex={0}>
                    <p className="profile-detail-label mb-1">Department</p>
                    <p className="profile-detail-value mb-0">{departmentLabel}</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="profile-request-card border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-2">Need to update something?</h5>
              <p className="text-muted mb-2">Profile field changes are handled by administrators.</p>
              {requestUpdateHref ? (
                <>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                    <a href={requestUpdateHref} className="btn btn-sm btn-primary">
                      Request Update
                    </a>
                    <Button type="button" variant="outline-secondary" size="sm" onClick={openPasswordModal}>
                      Update Password
                    </Button>
                  </div>
                  <p className="mb-0">
                    Send your profile update request by email and include your username plus exact changes needed.
                  </p>
                </>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                    <Button type="button" variant="outline-secondary" size="sm" onClick={openPasswordModal}>
                      Update Password
                    </Button>
                  </div>
                  <p className="mb-0">Contact your administrator to request profile field updates.</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showPasswordModal}
        onHide={closePasswordModal}
        centered
        backdrop={passwordSubmitting ? "static" : true}
        keyboard={!passwordSubmitting}
      >
        <Form onSubmit={submitPasswordUpdate}>
          <Modal.Header closeButton={!passwordSubmitting}>
            <Modal.Title>Update Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="profile-update-password-new">
              <Form.Label>New Password</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  autoComplete="new-password"
                  required
                  disabled={passwordSubmitting}
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowNewPassword((previous) => !previous)}
                  disabled={passwordSubmitting}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-0" controlId="profile-update-password-confirm">
              <Form.Label>Confirm Password</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Retype new password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  autoComplete="new-password"
                  required
                  disabled={passwordSubmitting}
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  disabled={passwordSubmitting}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </Form.Group>

            {passwordError ? (
              <div className="text-danger small mt-3" role="alert">
                {passwordError}
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={closePasswordModal}
              disabled={passwordSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={passwordSubmitting}>
              {passwordSubmitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Updating...
                </>
              ) : (
                "Confirm Update"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
