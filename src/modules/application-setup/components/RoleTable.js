/**
 * RoleTable Component
 * Displays roles in table format with status
 */

import { getRoleDisplayName, getRoleDescription, isRoleActive } from '../model/role.model.js';
import { getStatusBadgeColor, getStatusLabel } from '../utils/status.js';

export function RoleTable({ selectedApp, appRoles }) {
  if (!selectedApp) {
    return (
      <div style={{ padding: '12px', backgroundColor: '#cfe2ff', borderRadius: '4px', color: '#084298' }}>
        Select an application to view roles.
      </div>
    );
  }

  if (appRoles.length === 0) {
    return (
      <div style={{ padding: '12px', backgroundColor: '#cfe2ff', borderRadius: '4px', color: '#084298' }}>
        No roles assigned to this application.
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Role Name</th>
          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
          <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Active</th>
          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, width: '132px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {appRoles.map((role) => {
          const isActive = isRoleActive(role);
          const badgeColor = getStatusBadgeColor(isActive);

          return (
            <tr key={role.role_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{getRoleDisplayName(role)}</td>
              <td style={{ padding: '12px', color: '#666' }}>{getRoleDescription(role)}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: badgeColor.bg,
                    color: badgeColor.text,
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {getStatusLabel(isActive)}
                </span>
              </td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '30px',
                    height: '30px',
                    border: '1px solid #adb5bd',
                    borderRadius: '4px',
                    color: '#adb5bd',
                    marginRight: '6px',
                  }}
                  title="Edit action available in full admin setup"
                >
                  <i className="bi bi-pencil-square" aria-hidden="true" />
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '30px',
                    height: '30px',
                    border: '1px solid #adb5bd',
                    borderRadius: '4px',
                    color: '#adb5bd',
                    marginRight: '6px',
                  }}
                  title="Status action available in full admin setup"
                >
                  <i className="bi bi-slash-circle" aria-hidden="true" />
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '30px',
                    height: '30px',
                    border: '1px solid #adb5bd',
                    borderRadius: '4px',
                    color: '#adb5bd',
                  }}
                  title="Deactivate action available in full admin setup"
                >
                  <i className="bi bi-trash" aria-hidden="true" />
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
