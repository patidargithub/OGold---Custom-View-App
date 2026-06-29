import { useState } from 'react';
import { Field, Label, Input } from '@zendeskgarden/react-forms';
import { Button } from '@zendeskgarden/react-buttons';
import { SearchIcon } from './Icons';
import TicketTable from './TicketTable';
import FilterDrawer from './FilterDrawer';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchWrapper = styled.div`
  width: 300px;
  position: relative;
`;

const TicketsTabContainer = styled.div`
  width: 100%;
`;

export default function TicketsTab({
  tickets,
  totalCount,
  loading,
  error,
  currentPage,
  pageSize,
  onChangePage,
  selectedColumns,
  sortField,
  sortDirection,
  onSort,
  allFields,
  usersCache,
  groupsCache,
  orgsCache,
  onExportCSV,
  exporting,
  // Added properties for filter support inside drawer
  filters = [],
  onChangeFilters,
  groups = [],
  users = [],
  organizations = [],
  onApplyFilters
}) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  return (
    <TicketsTabContainer>
      {/* Search Input Box & Export/Filters Buttons */}
      <HeaderContainer>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            onClick={() => setIsFilterDrawerOpen(true)}
            size="medium"
            style={{ height: '40px' }}
          >
            Filters {filters.length > 0 ? `(${filters.length})` : ''}
          </Button>

          {totalCount > 0 && (
            <Button
              onClick={onExportCSV}
              disabled={exporting || loading}
              size="medium"
              style={{ height: '40px' }}
            >
              {exporting ? 'Exporting...' : 'Export to CSV'}
            </Button>
          )}
        </div>

        <SearchWrapper>
          <Field>
            <Label hidden>Search results</Label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#68737d' }}>
                <SearchIcon />
              </span>
              <Input
                placeholder="Search in loaded results..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px' }}
              />
            </div>
          </Field>
        </SearchWrapper>
      </HeaderContainer>

      {/* Ticket Table */}
      <TicketTable
        tickets={tickets}
        totalCount={totalCount}
        loading={loading}
        error={error}
        currentPage={currentPage}
        pageSize={pageSize}
        onChangePage={onChangePage}
        selectedColumns={selectedColumns}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        allFields={allFields}
        usersCache={usersCache}
        groupsCache={groupsCache}
        orgsCache={orgsCache}
        globalSearch={globalSearch}
      />

      {/* Slide-out Filters Drawer Overlay */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChangeFilters={onChangeFilters}
        fields={allFields}
        groups={groups}
        users={users}
        organizations={organizations}
        onApply={onApplyFilters}
      />
    </TicketsTabContainer>
  );
}
