/**
 * ApplicationSelector Component
 * Displays applications in table format for selection
 */

import React from 'react';
import {
  getApplicationDisplayOrder,
  getApplicationDisplayName,
  getApplicationDescription,
  isApplicationActive,
} from '../model/application.model.js';

export function ApplicationSelector({ applications, selectedAppId }) {
  if (!Array.isArray(applications) || applications.length === 0) {
    return React.createElement(
      'div',
      { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '20px' } },
      React.createElement('h3', { style: { marginBottom: '16px' } }, 'Applications'),
      React.createElement(
        'div',
        { style: { padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', color: '#664d03' } },
        'No active applications found.',
      ),
    );
  }

  return React.createElement(
    'div',
    { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '20px' } },
    React.createElement('h3', { style: { marginBottom: '16px' } }, 'Applications'),
    React.createElement(
      'div',
      { style: { color: '#6c757d', fontSize: '12px', marginBottom: '8px' } },
      'Click a row action to load roles for that application.',
    ),
    React.createElement(
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
            { style: { padding: '10px', textAlign: 'left', fontWeight: 600, width: '120px' } },
            'Actions',
          ),
          React.createElement('th', { style: { padding: '10px', textAlign: 'left', fontWeight: 600 } }, 'Application'),
          React.createElement(
            'th',
            { style: { padding: '10px', textAlign: 'left', fontWeight: 600, width: '72px' } },
            'Order',
          ),
          React.createElement(
            'th',
            { style: { padding: '10px', textAlign: 'left', fontWeight: 600 } },
            'Description',
          ),
          React.createElement(
            'th',
            { style: { padding: '10px', textAlign: 'center', fontWeight: 600, width: '110px' } },
            'Active',
          ),
        ),
      ),
      React.createElement(
        'tbody',
        null,
        applications.map((app) => {
          const isSelected = String(selectedAppId || '') === String(app.app_id || '');
          const isActive = isApplicationActive(app);
          const appOrder = getApplicationDisplayOrder(app, 0);

          return React.createElement(
            'tr',
            {
              key: app.app_id,
              style: {
                borderBottom: '1px solid #eee',
                backgroundColor: isSelected ? '#f0f4ff' : '#fff',
              },
            },
            React.createElement(
              'td',
              { style: { padding: '10px', whiteSpace: 'nowrap' } },
              React.createElement(
                'a',
                {
                  href: `?app=${app.app_id}`,
                  style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '30px',
                    height: '30px',
                    border: '1px solid #0d6efd',
                    borderRadius: '4px',
                    color: '#0d6efd',
                    textDecoration: 'none',
                    marginRight: '6px',
                  },
                  title: 'View roles',
                  'aria-label': `View roles for ${getApplicationDisplayName(app)}`,
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
                  title: 'Delete action available in full admin setup',
                },
                React.createElement('i', { className: 'bi bi-trash', 'aria-hidden': 'true' }),
              ),
            ),
            React.createElement(
              'td',
              { style: { padding: '10px' } },
              React.createElement(
                'a',
                {
                  href: `?app=${app.app_id}`,
                  style: { color: 'inherit', textDecoration: 'none', display: 'block', fontWeight: isSelected ? 600 : 500 },
                },
                getApplicationDisplayName(app),
              ),
            ),
            React.createElement(
              'td',
              { style: { padding: '10px' } },
              appOrder > 0 ? String(appOrder) : '--',
            ),
            React.createElement(
              'td',
              { style: { padding: '10px', color: '#666' } },
              React.createElement(
                'a',
                {
                  href: `?app=${app.app_id}`,
                  style: { color: 'inherit', textDecoration: 'none', display: 'block' },
                },
                getApplicationDescription(app),
              ),
            ),
            React.createElement(
              'td',
              { style: { padding: '10px', textAlign: 'center' } },
              React.createElement(
                'span',
                {
                  style: {
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: isActive ? '#d1e7dd' : '#cfe2ff',
                    color: isActive ? '#0a3622' : '#084298',
                    fontSize: '12px',
                    fontWeight: 500,
                  },
                },
                isActive ? 'Active' : 'Inactive',
              ),
            ),
          );
        }),
      ),
    ),
  );
}
