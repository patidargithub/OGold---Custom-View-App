import { useState, useEffect, useRef } from 'react';
import { Row, Col } from '@zendeskgarden/react-grid';
import { Field, Label, Select, Input } from '@zendeskgarden/react-forms';
import { Tag } from '@zendeskgarden/react-tags';
import { Button, IconButton } from '@zendeskgarden/react-buttons';
import { TrashIcon, PlusIcon, CloseIcon } from './Icons';
import styled from 'styled-components';

const FilterRowContainer = styled.div`
  background: white;
  border: 1px solid #edf0f2;
  border-left: 3px solid #1f73b7;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  position: relative;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  z-index: ${props => props.isActive ? '100' : '1'};

  &:hover {
    border-color: #cbd5e1;
    border-left-color: #14548a;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
    transform: translateY(-1px);
  }

  &:focus-within {
    z-index: 100;
  }
`;

const TrashIconButton = styled(IconButton)`
  color: #94a3b8 !important;
  transition: all 0.2s ease-in-out !important;

  &:hover {
    color: #d93f4c !important;
    background: #fef2f2 !important;
    transform: scale(1.08);
  }
`;
const RemoveButtonWrapper = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
`;
const AddFilterButton = styled(Button)`
  width: 100%;
  border: 1px dashed #cbd5e1 !important;
  background: white !important;
  color: #475569 !important;
  font-weight: 600 !important;
  height: 48px;
  border-radius: 6px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease-in-out !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: #1f73b7 !important;
    background: rgba(31, 115, 183, 0.04) !important;
    color: #1f73b7 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(31, 115, 183, 0.1);
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: white;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
`;

const EmptyStateIcon = styled.div`
  font-size: 36px;
  margin-bottom: 12px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
`;

const EmptyStateText = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0;
  max-width: 290px;
  line-height: 1.5;
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

const TagContent = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
          <TagContent>
            <span>{val}</span>
            <span 
              style={{ cursor: 'pointer', display: 'inline-flex' }} 
              onClick={() => removeValue(idx)}
            >
              <CloseIcon />
            </span>
          </TagContent>
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

function MultiSelectDropdown({ values, options = [], onChange, placeholder, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen, onToggle]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(opt =>
    !values.includes(opt.value) &&
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectOption = (optValue) => {
    onChange([...values, optValue]);
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const removeOption = (optValue) => {
    onChange(values.filter(val => val !== optValue));
  };

  const getOptionName = (val) => {
    const opt = options.find(o => o.value === val);
    return opt ? opt.name : val;
  };

  const handleContainerClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <MultiValueInputContainer onClick={handleContainerClick}>
        {values.map((val) => (
          <TagWrapper key={val} size="large" pill>
            <TagContent>
              <span>{getOptionName(val)}</span>
              <span
                style={{ cursor: 'pointer', display: 'inline-flex' }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(val);
                }}
              >
                <CloseIcon />
              </span>
            </TagContent>
          </TagWrapper>
        ))}
        <BorderlessInput
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
function SearchableSingleSelect({ value, options = [], onChange, placeholder = 'Search field...', onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen, onToggle]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <DropdownContainer ref={dropdownRef}>
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

/**
 * Custom dropdown select component for conditions / operators.
 */
function CustomSelect({ value, options = [], onChange, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen, onToggle]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOpt = options.find(opt => opt.value === value);
  const displayLabel = selectedOpt ? selectedOpt.label : value;

  return (
    <DropdownContainer ref={dropdownRef}>
      <div 
        style={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Input
          readOnly
          value={displayLabel}
          style={{ cursor: 'pointer', background: 'white' }}
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
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{ fontWeight: opt.value === value ? '600' : 'normal' }}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
}

export default function FilterBuilder({ filters, onChangeFilters, fields, groups, users = [], organizations = [], customStatuses = [] }) {
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Format fields to a standardized list of options
  const standardFieldsList = [
    { value: 'status', label: 'Status Category', type: 'dropdown', options: [
      { name: 'New', value: 'new' },
      { name: 'Open', value: 'open' },
      { name: 'Pending', value: 'pending' },
      { name: 'Hold', value: 'hold' },
      { name: 'Solved', value: 'solved' },
      { name: 'Closed', value: 'closed' }
    ]},
    { value: 'custom_status_id', label: 'Status', type: 'dropdown', options: customStatuses.map(cs => ({ name: cs.agent_label || cs.value, value: cs.id.toString() })) },
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
    .filter(f => !['subject', 'description', 'status', 'priority', 'type', 'group_id', 'assignee_id', 'requester_id', 'custom_status_id', 'status_id'].includes(f.name))
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
      {filters.length === 0 ? (
        <EmptyStateContainer>
          <EmptyStateIcon>🔍</EmptyStateIcon>
          <EmptyStateTitle>No Filters Active</EmptyStateTitle>
          <EmptyStateText>
            Add search conditions below to narrow down your ticket search query.
          </EmptyStateText>
        </EmptyStateContainer>
      ) : (
        filters.map((filter, index) => {
          const fieldInfo = getFieldInfo(filter.field) || {};
          const operators = getOperatorsForType(fieldInfo.type);

          return (
            <FilterRowContainer key={filter.id} isActive={activeDropdownId === filter.id}>
              <RemoveButtonWrapper>
                <TrashIconButton 
                  onClick={() => removeFilter(filter.id)} 
                  aria-label="Remove filter"
                >
                  <TrashIcon />
                </TrashIconButton>
              </RemoveButtonWrapper>

              <Row style={{ rowGap: '12px' }}>
                {/* 1. Field Selection (Takes full width, leaving room for top-right close button) */}
                <Col xs={11}>
                  <Field>
                    <Label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Filter Field
                    </Label>
                    <SearchableSingleSelect
                      value={filter.field}
                      options={allFields}
                      onChange={(val) => handleFilterChange(filter.id, 'field', val)}
                      placeholder="Select field..."
                      onToggle={(isOpen) => setActiveDropdownId(isOpen ? filter.id : null)}
                    />
                  </Field>
                </Col>

                {/* 2. Operator Selection */}
                <Col xs={4}>
                  <Field>
                    <Label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Condition
                    </Label>
                    <CustomSelect
                      value={filter.operator}
                      options={operators}
                      onChange={(val) => handleFilterChange(filter.id, 'operator', val)}
                      onToggle={(isOpen) => setActiveDropdownId(isOpen ? filter.id : null)}
                    />
                  </Field>
                </Col>

                {/* 3. Value Input */}
                <Col xs={8}>
                  <Field>
                    <Label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Value
                    </Label>
                    {fieldInfo.type === 'dropdown' ? (
                      <MultiSelectDropdown
                        values={filter.values}
                        options={fieldInfo.options}
                        onChange={(val) => handleFilterChange(filter.id, 'values', val)}
                        placeholder="Search & select options..."
                        onToggle={(isOpen) => setActiveDropdownId(isOpen ? filter.id : null)}
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
                      <Input
                        type="date"
                        value={filter.values[0] || ''}
                        onChange={(e) => handleFilterChange(filter.id, 'values', e.target.value ? [e.target.value] : [])}
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
              </Row>
            </FilterRowContainer>
          );
        })
      )}

      <AddFilterButton onClick={addFilter} startIcon={<PlusIcon />}>
        Add Filter Condition
      </AddFilterButton>
    </div>
  );
}
