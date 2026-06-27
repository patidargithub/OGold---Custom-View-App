import { useState } from 'react';
import { Field, Label, Input } from '@zendeskgarden/react-forms';
import { SearchIcon } from './Icons';
import TicketTable from './TicketTable';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

const SearchWrapper = styled.div`
  width: 300px;
  position: relative;
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
  orgsCache
}) {
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div>
      {/* Search Input Box */}
      <HeaderContainer>
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
                style={{ paddingLeft: '36px' }}
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
    </div>
  );
}
