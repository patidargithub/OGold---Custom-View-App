import { useState } from 'react';
import { Row, Col } from '@zendeskgarden/react-grid';
import { Field, Label, Input } from '@zendeskgarden/react-forms';
import styled from 'styled-components';
import { SearchIcon, PlusIcon, CloseIcon } from './Icons';

const ListContainer = styled.div`
  border: 1px solid #d8dcde;
  border-radius: 4px;
  height: 250px;
  overflow-y: auto;
  background: white;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #edf0f2;
  font-size: 14px;
  color: #2f3941;
  cursor: pointer;
  user-select: none;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f9fa;
  }
`;

const ListHeader = styled.div`
  font-weight: 600;
  font-size: 12px;
  color: #68737d;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const MoveButton = styled.button`
  background: none;
  border: none;
  color: #1f73b7;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #edf0f2;
  }
`;

const DraggableListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #edf0f2;
  font-size: 14px;
  color: #2f3941;
  background-color: ${props => props.isDragging ? '#edf0f2' : 'white'};
  opacity: ${props => props.isDragging ? 0.6 : 1};
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f9fa;
  }
`;

export default function ColumnPicker({ selectedColumns, onChangeSelectedColumns, fields }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  // All possible columns: standard fields + custom fields
  const standardFields = [
    { value: 'id', label: 'ID' },
    { value: 'subject', label: 'Subject' },
    { value: 'status', label: 'Status Category' },
    { value: 'priority', label: 'Priority' },
    { value: 'type', label: 'Type' },
    { value: 'satisfaction', label: 'Satisfaction' },
    { value: 'support_type', label: 'Support Type' },
    { value: 'group_id', label: 'Group' },
    { value: 'assignee_id', label: 'Assignee' },
    { value: 'requester_id', label: 'Requester' },
    { value: 'created_at', label: 'Created' },
    { value: 'updated_at', label: 'Updated' }
  ];

  const customFields = fields
    .filter(f => {
      const typeExclusions = ['subject', 'description', 'status', 'priority', 'tickettype', 'satisfaction', 'brand', 'group', 'assignee', 'requester', 'organization', 'support_type'];
      const nameExclusions = ['subject', 'description', 'status', 'priority', 'type', 'tickettype', 'group', 'group_id', 'assignee', 'assignee_id', 'requester', 'requester_id', 'organization', 'organization_id', 'custom_status_id', 'status_id', 'satisfaction', 'brand', 'support_type'];
      return !typeExclusions.includes(f.type) && !nameExclusions.includes(f.name);
    })
    .map(f => ({
      value: `custom_field_${f.id}`,
      label: f.title || f.raw_title || `Custom Field ${f.id}`
    }));

  const allColumns = [...standardFields, ...customFields];

  // Columns available to select (all except currently selected)
  const availableColumns = allColumns.filter(
    col => !selectedColumns.includes(col.value)
  );

  // Filter available columns by search query
  const filteredAvailable = availableColumns.filter(col =>
    col.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addColumn = (colValue) => {
    onChangeSelectedColumns([...selectedColumns, colValue]);
  };

  const removeColumn = (colValue) => {
    onChangeSelectedColumns(selectedColumns.filter(val => val !== colValue));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newCols = [...selectedColumns];
    const [draggedCol] = newCols.splice(draggedIndex, 1);
    newCols.splice(targetIndex, 0, draggedCol);
    onChangeSelectedColumns(newCols);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get label for a selected column code
  const getColLabel = (value) => {
    return allColumns.find(col => col.value === value)?.label || value;
  };

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#2f3941' }}>
        Configure Columns
      </h3>

      <Row>
        {/* Available columns side */}
        <Col xs={12} sm={6}>
          <ListHeader>Available Columns</ListHeader>
          <Field style={{ marginBottom: '8px' }}>
            <Label hidden>Search Columns</Label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#68737d' }}>
                <SearchIcon />
              </span>
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </Field>

          <ListContainer>
            {filteredAvailable.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#68737d', fontSize: '14px' }}>
                No columns match search.
              </div>
            ) : (
              filteredAvailable.map(col => (
                <ListItem key={col.value} onClick={() => addColumn(col.value)}>
                  <span>{col.label}</span>
                  <MoveButton aria-label={`Add ${col.label}`} onClick={(e) => { e.stopPropagation(); addColumn(col.value); }}>
                    <PlusIcon />
                  </MoveButton>
                </ListItem>
              ))
            )}
          </ListContainer>
        </Col>

        {/* Selected columns side */}
        <Col xs={12} sm={6}>
          <ListHeader>Selected Columns (Drag to reorder)</ListHeader>
          <div style={{ height: '40px' }} /> {/* Spacer matching input height */}
          
          <ListContainer>
            {selectedColumns.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#68737d', fontSize: '14px' }}>
                No columns selected. Please select at least one column.
              </div>
            ) : (
              selectedColumns.map((colValue, idx) => (
                <DraggableListItem
                  key={colValue}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === idx}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="#68737d" style={{ cursor: 'grab', marginRight: '4px' }}>
                      <path d="M5 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-6 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-6 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                    </svg>
                    <span>{getColLabel(colValue)}</span>
                  </div>
                  <MoveButton 
                    isDanger 
                    aria-label={`Remove ${getColLabel(colValue)}`} 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColumn(colValue);
                    }}
                  >
                    <CloseIcon />
                  </MoveButton>
                </DraggableListItem>
              ))
            )}
          </ListContainer>
        </Col>
      </Row>
    </div>
  );
}
