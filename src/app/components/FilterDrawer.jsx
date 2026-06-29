import styled from 'styled-components';
import { Button } from '@zendeskgarden/react-buttons';
import FilterBuilder from './FilterBuilder';

const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DrawerContent = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 500px;
  background: white;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
  flex-shrink: 0;
`;

const DrawerTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const DrawerBody = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 0;
  box-sizing: border-box;
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #edf0f2;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8fafc;
  flex-shrink: 0;
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
  onApply
}) {
  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClick={onClose} />
      <DrawerContent isOpen={isOpen}>
        <DrawerHeader>
          <DrawerTitle>Ticket Search Filters</DrawerTitle>
          <button 
            style={{ 
              border: 'none', 
              background: 'transparent', 
              fontSize: '18px', 
              color: '#64748b', 
              cursor: 'pointer',
              padding: '4px 8px'
            }}
            onClick={onClose}
          >
            ✕
          </button>
        </DrawerHeader>
        
        <DrawerBody>
          <FilterBuilder
            filters={filters}
            onChangeFilters={onChangeFilters}
            fields={fields}
            groups={groups}
            users={users}
            organizations={organizations}
          />
        </DrawerBody>
        
        <DrawerFooter>
          <Button onClick={onClose} size="medium">
            Cancel
          </Button>
          <Button 
            isPrimary 
            onClick={() => {
              onApply();
              onClose();
            }} 
            size="medium"
          >
            Apply Filters & Search
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </>
  );
}
