import { useState, useEffect, useRef } from 'react';
import { Row, Col } from '@zendeskgarden/react-grid';
import { Field, Label, Hint } from '@zendeskgarden/react-forms';
import { Tag } from '@zendeskgarden/react-tags';
import { Button } from '@zendeskgarden/react-buttons';
import styled, { keyframes } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
`;

const TabContainer = styled.div`
  animation: ${fadeIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 180px;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
`;

const HeaderTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
`;

const HeaderSub = styled.p`
  font-size: 13px;
  color: #94a3b8;
  margin: 6px 0 0 0;
  line-height: 1.5;
`;

const GlassCard = styled.div`
  background: white;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
    border-color: #cbd5e1;
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const IconContainer = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${props => props.bgColor || '#eff6ff'};
  color: ${props => props.color || '#2563eb'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const CardDescription = styled.p`
  font-size: 12px;
  color: #64748b;
  margin: 4px 0 0 0;
`;

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const InputGroupWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  min-height: 44px;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease-in-out;
  cursor: text;

  &:focus-within {
    border-color: #2563eb;
    background: white;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
  }
`;

const CleanInput = styled.input`
  border: none;
  outline: none;
  flex-grow: 1;
  font-size: 14px;
  color: #1e293b;
  min-width: 80px;
  height: 28px;
  background: transparent;
`;

const TagChip = styled(Tag)`
  margin: 2px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e2e8f0 !important;
  color: #334155 !important;
  border: none !important;
  font-weight: 500 !important;
  transition: all 0.15s ease-in-out;
  max-width: none !important;

  &:hover {
    background: #cbd5e1 !important;
  }

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


const DropdownMenu = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin: 6px 0 0 0;
  padding: 6px 0;
  list-style: none;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-sizing: border-box;
  animation: ${scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
`;

const DropdownItem = styled.li`
  padding: 10px 14px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }
`;

const EmptyItem = styled.li`
  padding: 10px 14px;
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  font-style: italic;
  cursor: default;
`;

// Inline SVGs
const RolesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

const GroupsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1.5" y1="1.5" x2="8.5" y2="8.5"></line>
    <line x1="8.5" y1="1.5" x2="1.5" y2="8.5"></line>
  </svg>
);

function MultiSelectField({
  values,
  options,
  onChange,
  placeholder,
  label,
  description,
  icon,
  iconBg,
  iconColor,
  adminRoleId = 'admin'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectItem = (val) => {
    if (!values.includes(val)) {
      onChange([...values, val]);
    }
    setSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const removeItem = (val) => {
    onChange(values.filter(item => item !== val));
  };

  const getOptionLabel = (val) => {
    if (val === adminRoleId) return 'Admin';
    const opt = options.find(o => o.id === val);
    return opt ? opt.name : val;
  };

  const filteredOptions = options.filter(opt =>
    opt.id !== adminRoleId &&
    opt.name.toLowerCase() !== 'admin' &&
    opt.name.toLowerCase() !== 'administrator' &&
    !values.includes(opt.id) &&
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GlassCard>
      <CardHeader>
        <IconContainer bgColor={iconBg} color={iconColor}>
          {icon}
        </IconContainer>
        <div>
          <CardTitle>{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>

      <Field>
        <DropdownContainer ref={containerRef}>
          <InputGroupWrapper onClick={() => {
            setIsOpen(true);
            if (inputRef.current) inputRef.current.focus();
          }}>
            {values.map(val => (
              <TagChip key={val} size="large" pill>
                <TagContent>
                  <span>{getOptionLabel(val)}</span>
                  {val !== adminRoleId && (
                    <span
                      style={{ cursor: 'pointer', display: 'inline-flex' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(val);
                      }}
                    >
                      <CloseIcon />
                    </span>
                  )}
                </TagContent>
              </TagChip>
            ))}
            <CleanInput
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={values.length === 0 ? placeholder : ''}
            />
          </InputGroupWrapper>

          {isOpen && (
            <DropdownMenu>
              {filteredOptions.length === 0 ? (
                <EmptyItem>No matches found</EmptyItem>
              ) : (
                filteredOptions.map(opt => (
                  <DropdownItem
                    key={opt.id}
                    onClick={() => {
                      selectItem(opt.id);
                      setIsOpen(false);
                    }}
                  >
                    {opt.name}
                  </DropdownItem>
                ))
              )}
            </DropdownMenu>
          )}
        </DropdownContainer>
      </Field>
    </GlassCard>
  );
}

const AlertBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${props => props.type === 'success' ? '#edfcf2' : '#fdf2f2'};
  border: 1px solid ${props => props.type === 'success' ? '#c8f7d5' : '#fcd2d2'};
  border-radius: 8px;
  color: ${props => props.type === 'success' ? '#1b7a43' : '#b81d1d'};
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  animation: ${fadeIn} 0.3s ease-out;
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
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

export default function AccessControlTab({
  roles,
  groups,
  users,
  selectedRoles,
  selectedGroups,
  selectedUsers,
  onSave,
  adminRoleId = 'admin'
}) {
  const [localRoles, setLocalRoles] = useState(selectedRoles);
  const [localGroups, setLocalGroups] = useState(selectedGroups);
  const [localUsers, setLocalUsers] = useState(selectedUsers);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    setLocalRoles(selectedRoles);
  }, [selectedRoles]);

  useEffect(() => {
    setLocalGroups(selectedGroups);
  }, [selectedGroups]);

  useEffect(() => {
    setLocalUsers(selectedUsers);
  }, [selectedUsers]);

  const handleSave = async () => {
    setSaveStatus(null);
    try {
      await onSave(localRoles, localGroups, localUsers);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return (
    <TabContainer>
      <HeaderSection>
        <HeaderTitle>Tab Access Control Settings</HeaderTitle>
        <HeaderSub>
          Restrict access to the Search Settings tab. By default, Zendesk Admins always have access. You can grant additional access to non-admin agents matching any of the configured roles, groups, or user accounts.
        </HeaderSub>
      </HeaderSection>

      <Row>
        <Col xs={12} md={4}>
          <MultiSelectField
            label="Roles"
            description="Allow access by standard or custom roles"
            placeholder="Search roles..."
            values={localRoles}
            options={roles}
            onChange={setLocalRoles}
            icon={<RolesIcon />}
            iconBg="#eff6ff"
            iconColor="#2563eb"
            adminRoleId={adminRoleId}
          />
        </Col>

        <Col xs={12} md={4}>
          <MultiSelectField
            label="Groups"
            description="Allow access to members of specific groups"
            placeholder="Search groups..."
            values={localGroups}
            options={groups}
            onChange={setLocalGroups}
            icon={<GroupsIcon />}
            iconBg="#f0fdf4"
            iconColor="#16a34a"
          />
        </Col>

        <Col xs={12} md={4}>
          <MultiSelectField
            label="Users"
            description="Grant access to specific agents explicitly"
            placeholder="Search users..."
            values={localUsers}
            options={users}
            onChange={setLocalUsers}
            icon={<UsersIcon />}
            iconBg="#faf5ff"
            iconColor="#7c3aed"
          />
        </Col>
      </Row>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', paddingBottom: '24px', marginTop: '12px' }}>
        {saveStatus === 'success' && (
          <AlertBanner type="success">
            <SuccessIcon />
            Access control settings successfully saved.
          </AlertBanner>
        )}
        {saveStatus === 'error' && (
          <AlertBanner type="error">
            <ErrorIcon />
            Failed to save access settings.
          </AlertBanner>
        )}
        <Button
          isPrimary
          onClick={handleSave}
          size="large"
          style={{ width: '220px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
        >
          Save Access Settings
        </Button>
      </div>
    </TabContainer>
  );
}
