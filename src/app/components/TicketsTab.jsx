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

const KpiContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 16px;
`;

const KpiCard = styled.div`
  width: 90px;
  height: 90px;
  background: white;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
  border-top: 4px solid ${props => props.borderColor || '#cbd5e1'};
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  }
`;

const KpiValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #2f3941;
  margin-bottom: 2px;
`;

const KpiLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #68737d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  onApplyFilters,
  kpiCounts = { new: 0, open: 0, pending: 0, hold: 0, solved: 0, closed: 0 },
  customStatuses = []
}) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const statusConfig = [
    { key: 'total', label: 'Total', color: '#1f73b7', isTotal: true },
    { key: 'new', label: 'New', color: '#1f73b7' },
    { key: 'open', label: 'Open', color: '#d93f4c' },
    { key: 'pending', label: 'Pending', color: '#f79a3b' },
    { key: 'hold', label: 'Hold', color: '#333333' },
    { key: 'solved', label: 'Solved', color: '#038153' },
    { key: 'closed', label: 'Closed', color: '#7f8c8d' }
  ];

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

      {/* KPI Cards Container */}
      <KpiContainer>
        {statusConfig.map(status => (
          <KpiCard key={status.key} borderColor={status.color}>
            <KpiValue>{status.isTotal ? totalCount : (kpiCounts[status.key] || 0)}</KpiValue>
            <KpiLabel>{status.label}</KpiLabel>
          </KpiCard>
        ))}
      </KpiContainer>

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
        customStatuses={customStatuses}
        onApply={onApplyFilters}
      />
    </TicketsTabContainer>
  );
}
