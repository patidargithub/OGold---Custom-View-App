import { useState } from 'react';
import { Row, Col } from '@zendeskgarden/react-grid';
import { Field, Label, Select } from '@zendeskgarden/react-forms';
import { Button } from '@zendeskgarden/react-buttons';
import styled from 'styled-components';
import ColumnPicker from './ColumnPicker';

const SettingsSection = styled.div`
  background: white;
  border: 1px solid #edf0f2;
  border-radius: 4px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #2f3941;
  border-bottom: 1px solid #edf0f2;
  padding-bottom: 8px;
`;

const AlertBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${props => props.type === 'success' ? '#edfcf2' : '#fdf2f2'};
  border: 1px solid ${props => props.type === 'success' ? '#c8f7d5' : '#fcd2d2'};
  border-radius: 4px;
  color: ${props => props.type === 'success' ? '#1b7a43' : '#b81d1d'};
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  margin-bottom: 8px;
`;

const SuccessIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function SettingsTab({
  selectedColumns,
  onChangeSelectedColumns,
  pageSize,
  onChangePageSize,
  defaultSortField,
  onChangeDefaultSortField,
  defaultSortDirection,
  onChangeDefaultSortDirection,
  fields,
  onSave
}) {
  const [saveStatus, setSaveStatus] = useState(null);

  const handleSave = async () => {
    setSaveStatus(null);
    try {
      await onSave();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return (
    <div>
      {/* 1. Column Picker Section */}
      <SettingsSection>
        <SectionHeader>Table Columns</SectionHeader>
        <ColumnPicker
          selectedColumns={selectedColumns}
          onChangeSelectedColumns={onChangeSelectedColumns}
          fields={fields}
        />
      </SettingsSection>

      {/* 2. Additional Settings Section */}
      <SettingsSection>
        <SectionHeader>Additional Settings</SectionHeader>
        <Row>
          {/* Page Size */}
          <Col xs={12} sm={4}>
            <Field>
              <Label>Page Size</Label>
              <Select
                value={pageSize.toString()}
                onChange={(e) => onChangePageSize(parseInt(e.target.value, 10))}
              >
                <option value="10">10 Tickets</option>
                <option value="25">25 Tickets (Default)</option>
                <option value="50">50 Tickets</option>
                <option value="100">100 Tickets</option>
              </Select>
            </Field>
          </Col>

          {/* Default Sorting Column */}
          <Col xs={12} sm={4}>
            <Field>
              <Label>Default Sorting Column</Label>
              <Select
                value={defaultSortField}
                onChange={(e) => onChangeDefaultSortField(e.target.value)}
              >
                <option value="created_at">Created Date</option>
                <option value="updated_at">Updated Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="type">Type</option>
              </Select>
            </Field>
          </Col>

          {/* Default Sort Direction */}
          <Col xs={12} sm={4}>
            <Field>
              <Label>Default Sort Direction</Label>
              <Select
                value={defaultSortDirection}
                onChange={(e) => onChangeDefaultSortDirection(e.target.value)}
              >
                <option value="desc">Descending (Newest First)</option>
                <option value="asc">Ascending (Oldest First)</option>
              </Select>
            </Field>
          </Col>
        </Row>
      </SettingsSection>

      {/* Save Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', paddingBottom: '24px' }}>
        {saveStatus === 'success' && (
          <AlertBanner type="success">
            <SuccessIcon />
            Search settings successfully saved.
          </AlertBanner>
        )}
        {saveStatus === 'error' && (
          <AlertBanner type="error">
            <ErrorIcon />
            Failed to save search settings.
          </AlertBanner>
        )}
        <Button 
          isPrimary 
          onClick={handleSave}
          size="large"
          style={{ width: '150px' }}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
