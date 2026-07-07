import { useMemo } from 'react';
import { Table, Head, Body, Row, Cell, HeaderRow, HeaderCell } from '@zendeskgarden/react-tables';
import { Tag } from '@zendeskgarden/react-tags';
import { Dots } from '@zendeskgarden/react-loaders';
import { Pagination } from '@zendeskgarden/react-pagination';
import styled from 'styled-components';
import { useClient } from '../hooks/useClient';

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const ScrollableTableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  margin-bottom: 16px;
`;

const StatusTag = styled(Tag)`
  font-weight: bold;
  text-transform: uppercase;
  font-size: 10px;
  padding: 2px 6px;
  background-color: ${props => {
    switch (props.status) {
      case 'new': return '#ffd3d3';
      case 'open': return '#e65100';
      case 'pending': return '#1f73b7';
      case 'hold': return '#2f3941';
      case 'solved': return '#d8dcde';
      case 'closed': return '#49545c';
      default: return '#edf0f2';
    }
  }};
  color: ${props => ['open', 'pending', 'hold', 'closed'].includes(props.status) ? 'white' : '#2f3941'};
`;

const ClickableRow = styled(Row)`
  cursor: pointer;
  &:hover {
    background-color: #f8f9fa;
  }
`;

const TableMetaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  margin-top: 12px;
`;

export default function TicketTable({
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
  globalSearch,
  subdomain
}) {
  const client = useClient();

  const handleRowClick = (ticketId) => {
    if (client) {
      client.invoke('routeTo', 'ticket', ticketId);
    }
  };

  // Map columns to human-readable names
  const getColLabel = (value) => {
    if (value === 'id') return 'ID';
    if (value === 'subject') return 'Subject';
    if (value === 'status') return 'Status';
    if (value === 'priority') return 'Priority';
    if (value === 'type') return 'Type';
    if (value === 'satisfaction') return 'Satisfaction';
    if (value === 'group_id') return 'Group';
    if (value === 'assignee_id') return 'Assignee';
    if (value === 'requester_id') return 'Requester';
    if (value === 'created_at') return 'Created';
    if (value === 'updated_at') return 'Updated';

    if (value.startsWith('custom_field_')) {
      const id = value.replace('custom_field_', '');
      const matched = allFields.find(f => f.id.toString() === id);
      return matched ? (matched.title || matched.raw_title) : value;
    }
    return value;
  };

  // Helper to format/resolve cell values
  const renderCellContent = (ticket, colCode) => {
    const val = ticket[colCode];

    if (colCode === 'id') {
      const ticketUrl = subdomain ? `https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}` : '#';
      return (
        <a 
          href={ticketUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#1f73b7', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
        >
          #{ticket.id}
        </a>
      );
    }
    
    if (colCode === 'subject') {
      const ticketUrl = subdomain ? `https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}` : '#';
      return (
        <a 
          href={ticketUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#2f3941', textDecoration: 'none' }}
          onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
        >
          {ticket.subject || '(No Subject)'}
        </a>
      );
    }
    
    if (colCode === 'status') {
      return <StatusTag status={ticket.status}>{ticket.status}</StatusTag>;
    }

    if (colCode === 'priority') return ticket.priority ? (ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)) : '-';
    if (colCode === 'type') return ticket.type ? (ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)) : '-';

    if (colCode === 'satisfaction') {
      const rating = ticket.satisfaction_rating;
      if (!rating || !rating.score || rating.score === 'unoffered') {
        return '-';
      }
      return rating.score.charAt(0).toUpperCase() + rating.score.slice(1);
    }

    if (colCode === 'group_id') {
      return groupsCache[ticket.group_id] || ticket.group_id || '-';
    }

    if (colCode === 'assignee_id') {
      return usersCache[ticket.assignee_id] || ticket.assignee_id || '-';
    }

    if (colCode === 'requester_id') {
      return usersCache[ticket.requester_id] || ticket.requester_id || '-';
    }

    if (colCode === 'created_at') {
      return ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '-';
    }

    if (colCode === 'updated_at') {
      return ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : '-';
    }

    // Resolve custom fields
    if (colCode.startsWith('custom_field_')) {
      const id = parseInt(colCode.replace('custom_field_', ''), 10);
      const customField = (ticket.custom_fields || []).find(cf => cf.id === id);
      if (!customField || customField.value === null || customField.value === undefined) {
        return '-';
      }

      // Check if this custom field is a dropdown and we have labels
      const matchedField = allFields.find(f => f.id === id);
      if (matchedField && matchedField.type === 'tagger' && matchedField.custom_field_options) {
        const option = matchedField.custom_field_options.find(opt => opt.value === customField.value);
        return option ? option.name : customField.value;
      }

      if (typeof customField.value === 'boolean') {
        return customField.value ? 'True' : 'False';
      }

      return customField.value.toString();
    }

    return val !== undefined && val !== null ? val.toString() : '-';
  };

  // Perform client-side filter and sorting based on active constraints
  const sortedAndFilteredTickets = useMemo(() => {
    let result = tickets;

    // 1. Filter results based on global search term
    if (globalSearch) {
      const term = globalSearch.toLowerCase();
      result = tickets.filter(t => {
        const subject = (t.subject || '').toLowerCase();
        const status = (t.status || '').toLowerCase();
        const priority = (t.priority || '').toLowerCase();
        const type = (t.type || '').toLowerCase();
        const group = (groupsCache[t.group_id] || '').toLowerCase();
        const assignee = (usersCache[t.assignee_id] || '').toLowerCase();
        const requester = (usersCache[t.requester_id] || '').toLowerCase();
        const ticketId = t.id.toString();

        return subject.includes(term) ||
               status.includes(term) ||
               priority.includes(term) ||
               type.includes(term) ||
               group.includes(term) ||
               assignee.includes(term) ||
               requester.includes(term) ||
               ticketId.includes(term);
      });
    }

    // 2. Apply client-side sorting if sorting is set on a non-server-sortable column
    const serverSortable = ['created_at', 'updated_at', 'priority', 'status', 'type'];
    if (sortField && !serverSortable.includes(sortField)) {
      result = [...result].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Resolve names for IDs to perform lexical sorting
        if (sortField === 'group_id') {
          valA = groupsCache[a.group_id] || '';
          valB = groupsCache[b.group_id] || '';
        } else if (sortField === 'satisfaction') {
          valA = a.satisfaction_rating?.score || '';
          valB = b.satisfaction_rating?.score || '';
        } else if (sortField === 'assignee_id') {
          valA = usersCache[a.assignee_id] || '';
          valB = usersCache[b.assignee_id] || '';
        } else if (sortField === 'requester_id') {
          valA = usersCache[a.requester_id] || '';
          valB = usersCache[b.requester_id] || '';
        } else if (sortField.startsWith('custom_field_')) {
          const id = parseInt(sortField.replace('custom_field_', ''), 10);
          const cfA = (a.custom_fields || []).find(cf => cf.id === id);
          const cfB = (b.custom_fields || []).find(cf => cf.id === id);
          valA = cfA ? cfA.value : '';
          valB = cfB ? cfB.value : '';

          const matchedField = allFields.find(f => f.id === id);
          if (matchedField && matchedField.type === 'tagger' && matchedField.custom_field_options) {
            const optA = matchedField.custom_field_options.find(opt => opt.value === valA);
            const optB = matchedField.custom_field_options.find(opt => opt.value === valB);
            valA = optA ? optA.name : (valA || '');
            valB = optB ? optB.name : (valB || '');
          }
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        // If numerical, compare directly
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        // Otherwise compare lexically as lowercased string
        const strA = valA.toString().toLowerCase();
        const strB = valB.toString().toLowerCase();

        if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [tickets, globalSearch, sortField, sortDirection, usersCache, groupsCache, allFields]);

  // Zendesk search API limits results to the first 1,000 records
  const maxSearchPages = Math.ceil(1000 / pageSize);
  const totalPages = Math.min(Math.ceil(totalCount / pageSize) || 1, maxSearchPages);

  const getErrorMessage = (err) => {
    if (!err) return '';
    if (err.responseText) {
      try {
        const parsed = JSON.parse(err.responseText);
        if (parsed.description) return parsed.description;
        if (parsed.error) return parsed.error;
      } catch (e) {
        // Fallback
      }
    }
    return err.message || err.statusText || 'An unknown API error occurred.';
  };

  if (error) {
    const errorMsg = getErrorMessage(error);
    const isSearchLimitError = errorMsg.includes('Search Response Limits') || errorMsg.includes('Search Limit');

    return (
      <div style={{ padding: '20px', background: '#fff0f0', border: '1px solid #ffd3d3', borderRadius: '4px', color: '#cc3333', margin: '16px 0' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>Error Retrieving Tickets</h4>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>{errorMsg}</p>
        {isSearchLimitError && (
          <p style={{ margin: 0, fontSize: '13px', color: '#5f6b73', borderTop: '1px dashed #ffd3d3', paddingTop: '8px' }}>
            💡 <strong>How to view other tickets:</strong> Zendesk limits searches to the first 1,000 tickets. Go back to the <strong>Search Settings</strong> tab and add narrower search filters (for example, limiting by status, date ranges, or tags) to slice your results into smaller datasets.
          </p>
        )}
      </div>
    );
  }

  return (
    <Container>
      <TableMetaHeader>
        <span style={{ fontSize: '14px', color: '#68737d' }}>
          Showing {sortedAndFilteredTickets.length} of {totalCount} matching tickets
        </span>
      </TableMetaHeader>

      {totalCount > 1000 && (
        <div style={{ padding: '10px 14px', background: '#e1f5fe', border: '1px solid #0288d1', borderRadius: '4px', color: '#01579b', fontSize: '13px', marginBottom: '12px' }}>
          ℹ️ <strong>Zendesk Search Limit:</strong> This query matches {totalCount} tickets. Zendesk only index-caches the first 1,000 results. To view other tickets, please refine your filter criteria in Search Settings.
        </div>
      )}

      <ScrollableTableWrapper>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
            <Dots size={32} />
            <span style={{ color: '#68737d', fontSize: '14px' }}>Retrieving ticket data...</span>
          </div>
        ) : sortedAndFilteredTickets.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#68737d', fontSize: '16px' }}>
            No tickets match the query parameters.
          </div>
        ) : (
          <Table size="medium">
            <Head style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fa' }}>
              <HeaderRow>
                {selectedColumns.map(col => {
                  return (
                    <HeaderCell 
                      key={col}
                      onClick={() => onSort(col)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{getColLabel(col)}</span>
                        {sortField === col && (
                          <span style={{ fontSize: '10px', color: '#1f73b7' }}>
                            {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                          </span>
                        )}
                      </div>
                    </HeaderCell>
                  );
                })}
              </HeaderRow>
            </Head>

            <Body>
              {sortedAndFilteredTickets.map(ticket => (
                <ClickableRow key={ticket.id} onClick={() => handleRowClick(ticket.id)}>
                  {selectedColumns.map(col => (
                    <Cell key={col}>
                      {renderCellContent(ticket, col)}
                    </Cell>
                  ))}
                </ClickableRow>
              ))}
            </Body>
          </Table>
        )}
      </ScrollableTableWrapper>

      {!loading && sortedAndFilteredTickets.length > 0 && totalCount > pageSize && (
        <TableFooter>
          <span style={{ fontSize: '14px', color: '#68737d' }}>
            Page {currentPage} of {totalPages}
          </span>
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onChange={onChangePage}
          />
        </TableFooter>
      )}
    </Container>
  );
}
