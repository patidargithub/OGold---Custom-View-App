import { useState } from 'react';
import { Row, Col } from '@zendeskgarden/react-grid';
import { Field, Label, Select, Input } from '@zendeskgarden/react-forms';
import { Tag } from '@zendeskgarden/react-tags';
import { Button, IconButton } from '@zendeskgarden/react-buttons';
import { TrashIcon, PlusIcon, CloseIcon } from './Icons';
import styled from 'styled-components';

const FilterRowContainer = styled.div`
  background: ${props => props.theme.colors ? props.theme.colors.background : '#f8f9fa'};
  border: 1px solid #d8dcde;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  position: relative;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #a5b2bd;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
`;

const MultiValueInputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #d8dcde;
  border-radius: 4px;
  background: white;
  min-height: 40px;
  width: 100%;
  box-sizing: border-box;

  &:focus-within {
    border-color: #1f73b7;
    box-shadow: 0 0 0 3px rgba(31, 115, 183, 0.15);
  }
`;

const BorderlessInput = styled.input`
  border: none;
  outline: none;
  flex-grow: 1;
  font-size: 14px;
  color: #2f3941;
  min-width: 60px;
  height: 28px;
`;

const TagWrapper = styled(Tag)`
  margin: 2px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: none !important;

  /* Force Zendesk Garden inner tag label elements to display full text without truncation */
  & > span, & * {
    max-width: none !important;
    text-overflow: unset !important;
    overflow: visible !important;
    white-space: nowrap !important;
  }
`;

/**
 * Custom Tag-based Input Component for multi-value entry.
 */
function TagInput({ values, onChange, placeholder, type = "text" }) {
  const [inputValue, setInputValue] = useState('');

  const addValue = (val) => {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addValue(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const handleBlur = () => {
    addValue(inputValue);
  };

  const removeValue = (indexToRemove) => {
    onChange(values.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <MultiValueInputContainer>
      {values.map((val, idx) => (
        <TagWrapper key={idx} size="large" pill>
          <span>{val}</span>
          <span 
            style={{ cursor: 'pointer', display: 'inline-flex', paddingLeft: '4px' }} 
            onClick={() => removeValue(idx)}
          >
            <CloseIcon />
          </span>
        </TagWrapper>
      ))}
      <BorderlessInput
        type={type}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={values.length === 0 ? placeholder : ''}
      />
    </MultiValueInputContainer>
  );
}

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownMenu = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin: 4px 0 0 0;
  padding: 4px 0;
  list-style: none;
  background: white;
  border: 1px solid #d8dcde;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-height: 180px;
  overflow-y: auto;
  z-index: 100;
  box-sizing: border-box;
`;

const DropdownMenuItem = styled.li`
  padding: 8px 12px;
  font-size: 14px;
  color: #2f3941;
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: #edf0f2;
  }
`;

function MultiSelectDropdown({ values, options = [], onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt =>
    !values.includes(opt.value) &&
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectOption = (optValue) => {
    onChange([...values, optValue]);
    setSearchTerm('');
  };

  const removeOption = (optValue) => {
    onChange(values.filter(val => val !== optValue));
  };

  const getOptionName = (val) => {
    const opt = options.find(o => o.value === val);
    return opt ? opt.name : val;
  };

  return (
    <DropdownContainer>
      <MultiValueInputContainer onClick={() => setIsOpen(true)}>
        {values.map((val) => (
          <TagWrapper key={val} size="large" pill>
            <span>{getOptionName(val)}</span>
            <span
              style={{ cursor: 'pointer', display: 'inline-flex', paddingLeft: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
                removeOption(val);
              }}
            >
              <CloseIcon />
            </span>
          </TagWrapper>
        ))}
        <BorderlessInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={values.length === 0 ? placeholder : ''}
        />
      </MultiValueInputContainer>

      {isOpen && (
        <DropdownMenu>
          {filteredOptions.length === 0 ? (
            <DropdownMenuItem 
              style={{ color: '#68737d', cursor: 'default', fontStyle: 'italic' }} 
              onMouseDown={(e) => e.preventDefault()}
            >
              No matches found
            </DropdownMenuItem>
          ) : (
            filteredOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => selectOption(opt.value)}
              >
                {opt.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
}

/**
 * Autocomplete / Searchable dropdown for single field selections.
 */
function SearchableSingleSelect({ value, options = [], onChange, placeholder = 'Search field...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOpt = options.find(opt => opt.value === value);
  const displayLabel = selectedOpt ? selectedOpt.label : '';

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectOption = (val) => {
    onChange(val);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <DropdownContainer>
      <div style={{ position: 'relative' }}>
        <Input
          value={isOpen ? searchTerm : displayLabel}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true);
            setSearchTerm(e.target.value);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setSearchTerm('');
            }, 200);
          }}
          placeholder={placeholder}
        />
        <span
          style={{
            position: 'absolute',
            right: '12px',
            top: '12px',
            pointerEvents: 'none',
            fontSize: '9px',
            color: '#68737d'
          }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <DropdownMenu>
          {filteredOptions.length === 0 ? (
            <DropdownMenuItem
              style={{ color: '#68737d', cursor: 'default', fontStyle: 'italic' }}
              onMouseDown={(e) => e.preventDefault()}
            >
              No fields found
            </DropdownMenuItem>
          ) : (
            filteredOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => selectOption(opt.value)}
                style={{ fontWeight: opt.value === value ? '600' : 'normal' }}
              >
                {opt.label}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
}

export default function FilterBuilder({ filters, onChangeFilters, fields, groups, users = [], organizations = [] }) {
  
  // Format fields to a standardized list of options
  const standardFieldsList = [
    { value: 'status', label: 'Status', type: 'dropdown', options: [
      { name: 'New', value: 'new' },
      { name: 'Open', value: 'open' },
      { name: 'Pending', value: 'pending' },
      { name: 'Hold', value: 'hold' }
    ]},
    { value: 'priority', label: 'Priority', type: 'dropdown', options: [
      { name: 'Low', value: 'low' },
      { name: 'Normal', value: 'normal' },
      { name: 'High', value: 'high' },
      { name: 'Urgent', value: 'urgent' }
    ]},
    { value: 'type', label: 'Type', type: 'dropdown', options: [
      { name: 'Question', value: 'question' },
      { name: 'Incident', value: 'incident' },
      { name: 'Problem', value: 'problem' },
      { name: 'Task', value: 'task' }
    ]},
    { value: 'group_id', label: 'Group', type: 'dropdown', options: groups.map(g => ({ name: g.name, value: g.id.toString() })) },
    { value: 'assignee_id', label: 'Assignee', type: 'dropdown', options: users.map(u => ({ name: u.name, value: u.id.toString() })) },
    { value: 'requester_id', label: 'Requester', type: 'dropdown', options: users.map(u => ({ name: u.name, value: u.id.toString() })) },
    { value: 'organization_id', label: 'Organization', type: 'dropdown', options: organizations.map(o => ({ name: o.name, value: o.id.toString() })) },
    { value: 'tags', label: 'Tags', type: 'tag' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
    { value: 'updated_at', label: 'Updated Date', type: 'date' }
  ];

  // Custom fields converted to standardized objects
  const customFieldsList = fields
    .filter(f => !['subject', 'description', 'status', 'priority', 'type', 'group_id', 'assignee_id', 'requester_id'].includes(f.name))
    .map(f => {
      let fieldType = 'text';
      if (f.type === 'tagger') fieldType = 'dropdown';
      else if (f.type === 'checkbox') fieldType = 'checkbox';
      else if (f.type === 'date') fieldType = 'date';
      else if (f.type === 'integer' || f.type === 'decimal') fieldType = 'number';

      return {
        value: `custom_field_${f.id}`,
        label: f.title || f.raw_title || `Custom Field ${f.id}`,
        type: fieldType,
        options: f.custom_field_options ? f.custom_field_options.map(opt => ({ name: opt.name, value: opt.value })) : []
      };
    });

  // Combine lists and deduplicate by label to prevent duplicate filter items (e.g. Status)
  const allFields = [];
  const seenLabels = new Set();

  standardFieldsList.forEach(field => {
    allFields.push(field);
    seenLabels.add(field.label.toLowerCase());
  });

  customFieldsList.forEach(field => {
    const labelLower = field.label.toLowerCase();
    if (!seenLabels.has(labelLower)) {
      allFields.push(field);
      seenLabels.add(labelLower);
    }
  });

  const getFieldInfo = (fieldValue) => {
    return allFields.find(f => f.value === fieldValue);
  };

  const getOperatorsForType = (type) => {
    switch (type) {
      case 'dropdown':
      case 'checkbox':
        return [
          { value: '=', label: 'Is' },
          { value: '!=', label: 'Is Not' }
        ];
      case 'date':
      case 'number':
        return [
          { value: '=', label: 'Is' },
          { value: '!=', label: 'Is Not' },
          { value: '>', label: 'Greater Than' },
          { value: '<', label: 'Less Than' },
          { value: '>=', label: 'Greater Than or Equal' },
          { value: '<=', label: 'Less Than or Equal' }
        ];
      case 'tag':
      case 'text':
      default:
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'does not contain', label: 'Does Not Contain' }
        ];
    }
  };

  const addFilter = () => {
    const defaultField = allFields[0]?.value || '';
    const fieldInfo = getFieldInfo(defaultField);
    const defaultOp = getOperatorsForType(fieldInfo?.type)[0]?.value || '=';

    onChangeFilters([
      ...filters,
      {
        id: Math.random().toString(36).substr(2, 9),
        field: defaultField,
        operator: defaultOp,
        values: []
      }
    ]);
  };

  const removeFilter = (id) => {
    onChangeFilters(filters.filter(f => f.id !== id));
  };

  const handleFilterChange = (id, key, value) => {
    const updated = filters.map(f => {
      if (f.id === id) {
        const updatedFilter = { ...f, [key]: value };
        // Reset operator and values if field changes
        if (key === 'field') {
          const fieldInfo = getFieldInfo(value);
          const ops = getOperatorsForType(fieldInfo?.type);
          updatedFilter.operator = ops[0]?.value || '=';
          updatedFilter.values = [];
        }
        return updatedFilter;
      }
      return f;
    });
    onChangeFilters(updated);
  };

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#2f3941' }}>
        Filter Conditions
      </h3>

      {filters.length === 0 ? (
        <div style={{ padding: '24px', border: '1px dashed #d8dcde', borderRadius: '4px', textAlign: 'center', color: '#68737d', marginBottom: '16px' }}>
          No filters added. Tickets will be retrieved without specific constraints.
        </div>
      ) : (
        filters.map((filter, index) => {
          const fieldInfo = getFieldInfo(filter.field) || {};
          const operators = getOperatorsForType(fieldInfo.type);

          return (
            <FilterRowContainer key={filter.id}>
              <Row align="center" style={{ rowGap: '12px' }}>
                {/* Field Selection */}
                <Col xs={12} sm={4}>
                  <Field>
                    <Label hidden>Field</Label>
                    <SearchableSingleSelect
                      value={filter.field}
                      options={allFields}
                      onChange={(val) => handleFilterChange(filter.id, 'field', val)}
                      placeholder="Search field..."
                    />
                  </Field>
                </Col>

                {/* Operator Selection */}
                <Col xs={12} sm={3}>
                  <Field>
                    <Label hidden>Operator</Label>
                    <Select
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(filter.id, 'operator', e.target.value)}
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </Select>
                  </Field>
                </Col>

                {/* Value Input */}
                <Col xs={10} sm={4}>
                  <Field>
                    <Label hidden>Values</Label>
                    {fieldInfo.type === 'dropdown' ? (
                      <MultiSelectDropdown
                        values={filter.values}
                        options={fieldInfo.options}
                        onChange={(vals) => handleFilterChange(filter.id, 'values', vals)}
                        placeholder="Search & select options..."
                      />
                    ) : fieldInfo.type === 'checkbox' ? (
                      <Select
                        value={filter.values[0] || ''}
                        onChange={(e) => handleFilterChange(filter.id, 'values', e.target.value ? [e.target.value] : [])}
                      >
                        <option value="">Select boolean...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </Select>
                    ) : fieldInfo.type === 'date' ? (
                      <TagInput
                        type="date"
                        values={filter.values}
                        onChange={(val) => handleFilterChange(filter.id, 'values', val)}
                        placeholder="Add Date (YYYY-MM-DD) + Enter"
                      />
                    ) : fieldInfo.type === 'number' ? (
                      <TagInput
                        type="number"
                        values={filter.values}
                        onChange={(val) => handleFilterChange(filter.id, 'values', val)}
                        placeholder="Add Number + Enter"
                      />
                    ) : (
                      <TagInput
                        values={filter.values}
                        onChange={(val) => handleFilterChange(filter.id, 'values', val)}
                        placeholder="Type value + Enter"
                      />
                    )}
                  </Field>
                </Col>

                {/* Remove Button */}
                <Col xs={2} sm={1} style={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    onClick={() => removeFilter(filter.id)} 
                    aria-label="Remove filter"
                    isDanger
                  >
                    <TrashIcon />
                  </IconButton>
                </Col>
              </Row>
            </FilterRowContainer>
          );
        })
      )}

      <Button onClick={addFilter} startIcon={<PlusIcon />} style={{ marginTop: '8px' }}>
        Add Filter Condition
      </Button>
    </div>
  );
}
