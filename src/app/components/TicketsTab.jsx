import { useState } from 'react';
import { Field, Label, Input } from '@zendeskgarden/react-forms';
import { Button } from '@zendeskgarden/react-buttons';
import { SearchIcon } from './Icons';
import TicketTable from './TicketTable';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
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
  exporting
}) {
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <TicketsTabContainer>
      {/* Search Input Box & Export Button */}
      <HeaderContainer>
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
    </TicketsTabContainer>
  );
}
