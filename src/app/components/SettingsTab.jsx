import { Row, Col } from '@zendeskgarden/react-grid';
import { Field, Label, Select } from '@zendeskgarden/react-forms';
import { Button } from '@zendeskgarden/react-buttons';
import styled from 'styled-components';
import FilterBuilder from './FilterBuilder';
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

export default function SettingsTab({
  filters,
  onChangeFilters,
  selectedColumns,
  onChangeSelectedColumns,
  pageSize,
  onChangePageSize,
  defaultSortField,
  onChangeDefaultSortField,
  defaultSortDirection,
  onChangeDefaultSortDirection,
  fields,
  groups,
  onSave
}) {
  return (
    <div>
      {/* 1. Filter Builder Section */}
      <SettingsSection>
        <SectionHeader>Ticket Filters</SectionHeader>
        <FilterBuilder
          filters={filters}
          onChangeFilters={onChangeFilters}
          fields={fields}
          groups={groups}
        />
      </SettingsSection>

      {/* 2. Column Picker Section */}
      <SettingsSection>
        <SectionHeader>Table Columns</SectionHeader>
        <ColumnPicker
          selectedColumns={selectedColumns}
          onChangeSelectedColumns={onChangeSelectedColumns}
          fields={fields}
        />
      </SettingsSection>

      {/* 3. Additional Settings Section */}
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '24px' }}>
        <Button 
          isPrimary 
          onClick={onSave}
          size="large"
          style={{ width: '150px' }}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
