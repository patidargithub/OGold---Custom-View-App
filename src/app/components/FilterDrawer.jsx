import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@zendeskgarden/react-buttons';
import FilterBuilder from './FilterBuilder';

const ValidationBanner = styled.div`
  background: #fef2f2;
  border-left: 4px solid #d93f4c;
  color: #991b1b;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DrawerContent = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 520px;
  background: #ffffff;
  border-left: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: -10px 0 30px rgba(15, 23, 42, 0.1);
  z-index: 1001;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
`;

const DrawerHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #edf0f2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  flex-shrink: 0;
`;

const HeaderTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DrawerTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
`;

const DrawerSubtitle = styled.span`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 0;
  box-sizing: border-box;
  background: #fafbfb;
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #edf0f2;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  flex-shrink: 0;
`;

const PremiumApplyButton = styled(Button)`
  transition: all 0.2s ease-in-out !important;

  &:hover:not([disabled]) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(31, 115, 183, 0.25);
  }

  &:active:not([disabled]) {
    transform: translateY(0);
  }
`;

const ClearAllButton = styled(Button)`
  margin-right: auto;
  color: #d93f4c !important;
  font-weight: 600 !important;
  
  &:hover {
    background-color: #fef2f2 !important;
  }
`;

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  fields,
  groups,
  users,
  organizations,
  onApply,
  customStatuses = []
}) {
  const [validationError, setValidationError] = useState(null);
  const [localFilters, setLocalFilters] = useState([]);

  // Sync draft filters when the drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(JSON.parse(JSON.stringify(filters || [])));
      setValidationError(null);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!isOpen) {
      setValidationError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setValidationError(null);
  }, [localFilters]);

  const handleClearAll = () => {
    setLocalFilters([]);
  };

  const handleApply = () => {
    const hasEmptyField = localFilters.some(filter => {
      // Validate that the filter has a selected field, operator, and at least one non-empty value
      return !filter.field || !filter.values || filter.values.length === 0 || filter.values.every(v => v === undefined || v === null || v.toString().trim() === '');
    });

    if (hasEmptyField) {
      setValidationError('Please select a field and fill in all values for each filter condition.');
      return;
    }

    setValidationError(null);
    onApply(localFilters);
    onClose();
  };

  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClick={onClose} />
      <DrawerContent isOpen={isOpen}>
        <DrawerHeader>
          <HeaderTitleContainer>
            <DrawerTitle>Ticket Search Filters</DrawerTitle>
            <DrawerSubtitle>
              {localFilters.length === 0 
                ? 'No active conditions applied' 
                : `${localFilters.length} search condition${localFilters.length > 1 ? 's' : ''} active`}
            </DrawerSubtitle>
          </HeaderTitleContainer>
          <CloseButton onClick={onClose} title="Close Panel">
            ✕
          </CloseButton>
        </DrawerHeader>
        
        <DrawerBody>
          {validationError && (
            <ValidationBanner>
              ⚠️ {validationError}
            </ValidationBanner>
          )}
          <FilterBuilder
            filters={localFilters}
            onChangeFilters={setLocalFilters}
            fields={fields}
            groups={groups}
            users={users}
            organizations={organizations}
            customStatuses={customStatuses}
          />
        </DrawerBody>
        
        <DrawerFooter>
          {localFilters.length > 0 && (
            <ClearAllButton 
              onClick={handleClearAll} 
              size="medium"
              isBasic
            >
              Clear All
            </ClearAllButton>
          )}
          
          <Button onClick={onClose} size="medium">
            Cancel
          </Button>
          
          <PremiumApplyButton 
            isPrimary 
            onClick={handleApply} 
            size="medium"
          >
            Apply Filters
          </PremiumApplyButton>
        </DrawerFooter>
      </DrawerContent>
    </>
  );
}
