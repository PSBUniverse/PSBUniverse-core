/**
 * RoleTable Component
 * Displays roles in table format with status
 */

import React from 'react';
import { getRoleDisplayName, getRoleDescription, isRoleActive } from '../model/role.model.js';
import { getStatusBadgeColor, getStatusLabel } from '../utils/status.js';

export function RoleTable({ selectedApp, appRoles }) {
  if (!selectedApp) {
    return React.createElement(
      'div',
      { style: { padding: '12px', backgroundColor: '#cfe2ff', borderRadius: '4px', color: '#084298' } },
      'Select an application to view roles.',
    );
  }

  if (appRoles.length === 0) {
    return React.createElement(
      'div',
      { style: { padding: '12px', backgroundColor: '#cfe2ff', borderRadius: '4px', color: '#084298' } },
      'No roles assigned to this application.',
    );
  }

  return React.createElement(
    'table',
    { style: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' } },
    React.createElement(
      'thead',
      null,
      React.createElement(
        'tr',
        { style: { borderBottom: '2px solid #ddd' } },
        React.createElement(
          'th',
          { style: { padding: '12px', textAlign: 'left', fontWeight: 600 } },
          'Role Name',
        ),
        React.createElement(
          'th',
          { style: { padding: '12px', textAlign: 'left', fontWeight: 600 } },
          'Description',
        ),
        React.createElement(
          'th',
          { style: { padding: '12px', textAlign: 'center', fontWeight: 600 } },
          'Active',
        ),
        React.createElement(
          'th',
          { style: { padding: '12px', textAlign: 'left', fontWeight: 600, width: '132px' } },
          'Actions',
        ),
      ),
    ),
    React.createElement(
      'tbody',
      null,
      appRoles.map((role) => {
        const isActive = isRoleActive(role);
        const badgeColor = getStatusBadgeColor(isActive);

        return React.createElement(
          'tr',
          { key: role.role_id, style: { borderBottom: '1px solid #eee' } },
          React.createElement(
            'td',
            { style: { padding: '12px' } },
            getRoleDisplayName(role),
          ),
          React.createElement(
            'td',
            { style: { padding: '12px', color: '#666' } },
            getRoleDescription(role),
          ),
          React.createElement(
            'td',
            { style: { padding: '12px', textAlign: 'center' } },
            React.createElement(
              'span',
              {
                style: {
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: badgeColor.bg,
                  color: badgeColor.text,
                  fontSize: '12px',
                  fontWeight: 500,
                },
              },
              getStatusLabel(isActive),
            ),
          ),
          React.createElement(
            'td',
            { style: { padding: '12px', whiteSpace: 'nowrap' } },
            React.createElement(
              'span',
              {
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '30px',
                  height: '30px',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  color: '#adb5bd',
                  marginRight: '6px',
                },
                title: 'Edit action available in full admin setup',
              },
              React.createElement('i', { className: 'bi bi-pencil-square', 'aria-hidden': 'true' }),
            ),
            React.createElement(
              'span',
              {
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '30px',
                  height: '30px',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  color: '#adb5bd',
                  marginRight: '6px',
                },
                title: 'Status action available in full admin setup',
              },
              React.createElement('i', { className: 'bi bi-slash-circle', 'aria-hidden': 'true' }),
            ),
            React.createElement(
              'span',
              {
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '30px',
                  height: '30px',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  color: '#adb5bd',
                },
                title: 'Deactivate action available in full admin setup',
              },
              React.createElement('i', { className: 'bi bi-trash', 'aria-hidden': 'true' }),
            ),
          ),
        );
      }),
    ),
  );
}
