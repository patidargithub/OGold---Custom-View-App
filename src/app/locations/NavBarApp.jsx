import { useState, useEffect } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs';
import { useClient } from '../hooks/useClient';
import { fetchTicketFields, searchTickets, buildSearchQuery, requestWithRetry } from '../services/zendeskApi';
import SettingsTab from '../components/SettingsTab';
import TicketsTab from '../components/TicketsTab';
import styled from 'styled-components';

const AppContainer = styled.div`
  padding: 16px;
  background-color: #f8f9fa;
  min-height: 500px;
  font-family: system-ui, -apple-system, sans-serif;
`;

const AppHeader = styled.div`
  margin-bottom: 20px;
`;

const AppTitle = styled.h1`
  font-size: 22px;
  font-weight: 600;
  color: #2f3941;
  margin: 0 0 4px 0;
`;

const AppSubtitle = styled.p`
  font-size: 14px;
  color: #68737d;
  margin: 0;
`;

export default function NavBarApp() {
  const client = useClient();

  // Layout state
  const [activeTab, setActiveTab] = useState('settings');

  // Search parameters state
  const [filters, setFilters] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([
    'id',
    'subject',
    'status',
    'priority',
    'created_at'
  ]);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Metadata caches
  const [fields, setFields] = useState([]);
  const [groups, setGroups] = useState([]);
  const [usersCache, setUsersCache] = useState({});
  const [groupsCache, setGroupsCache] = useState({});
  const [orgsCache, setOrgsCache] = useState({});

  // Search results state
  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize and load metadata on startup
  useEffect(() => {
    async function loadMetadata() {
      if (!client) return;
      try {
        setLoading(true);
        // Fetch all fields
        const fetchedFields = await fetchTicketFields(client);
        setFields(fetchedFields);

        // Fetch groups to resolve IDs to names
        const groupsRes = await requestWithRetry(client, {
          url: '/api/v2/groups.json',
          type: 'GET',
          dataType: 'json'
        });
        const fetchedGroups = groupsRes.groups || [];
        setGroups(fetchedGroups);

        // Build initial groups cache
        const gCache = {};
        fetchedGroups.forEach(g => {
          gCache[g.id] = g.name;
        });
        setGroupsCache(gCache);

      } catch (err) {
        console.error('Failed to load initial Zendesk metadata:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadMetadata();
  }, [client]);

  // Main search function
  const runTicketSearch = async (page = 1, forceSortField = null, forceSortDir = null) => {
    if (!client) return;
    setLoading(true);
    setError(null);

    const activeSortField = forceSortField !== null ? forceSortField : sortField;
    const activeSortDir = forceSortDir !== null ? forceSortDir : sortDirection;

    try {
      const query = buildSearchQuery(filters);
      
      const serverSortable = ['created_at', 'updated_at', 'priority', 'status', 'type'];
      const apiSortBy = serverSortable.includes(activeSortField) ? activeSortField : 'created_at';
      const apiSortOrder = serverSortable.includes(activeSortField) ? activeSortDir : 'desc';

      const result = await searchTickets(client, {
        query,
        page,
        perPage: pageSize,
        sortBy: apiSortBy,
        sortOrder: apiSortOrder
      });

      // Update name caches with side-loaded users, groups, and orgs
      const newUsers = { ...usersCache };
      result.sideloads.users.forEach(u => {
        newUsers[u.id] = u.name;
      });

      const newGroups = { ...groupsCache };
      result.sideloads.groups.forEach(g => {
        newGroups[g.id] = g.name;
      });

      const newOrgs = { ...orgsCache };
      result.sideloads.organizations.forEach(o => {
        newOrgs[o.id] = o.name;
      });

      setUsersCache(newUsers);
      setGroupsCache(newGroups);
      setOrgsCache(newOrgs);

      // Save results
      setTickets(result.tickets);
      setTotalCount(result.count);
      setCurrentPage(page);

      // Auto route to results tab on search submit
      setActiveTab('tickets');
    } catch (err) {
      console.error('Error during ticket retrieval:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    const newDir = (sortField === field && sortDirection === 'desc') ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDir);
    
    // Update state and immediately re-trigger search with new sorting
    // We only trigger API search if the sort field is server-sortable.
    // If it is not server-sortable, client-side sorting in TicketTable will instantly kick in.
    const serverSortable = ['created_at', 'updated_at', 'priority', 'status', 'type'];
    if (serverSortable.includes(field)) {
      setTimeout(() => {
        runTicketSearch(1, field, newDir);
      }, 0);
    }
  };

  return (
    <AppContainer>
      <AppHeader>
        <AppTitle>Zendesk Custom Ticket Search</AppTitle>
        <AppSubtitle>Build complex multi-value searches across standard and custom fields</AppSubtitle>
      </AppHeader>

      <Tabs selectedItem={activeTab} onChange={setActiveTab}>
        <TabList style={{ marginBottom: '20px' }}>
          <Tab item="settings">Search Settings</Tab>
          <Tab item="tickets">Matching Tickets ({totalCount})</Tab>
        </TabList>

        {/* Settings Panel */}
        <TabPanel item="settings">
          <SettingsTab
            filters={filters}
            onChangeFilters={setFilters}
            selectedColumns={selectedColumns}
            onChangeSelectedColumns={setSelectedColumns}
            pageSize={pageSize}
            onChangePageSize={setPageSize}
            defaultSortField={sortField}
            onChangeDefaultSortField={setSortField}
            defaultSortDirection={sortDirection}
            onChangeDefaultSortDirection={setSortDirection}
            fields={fields}
            groups={groups}
            onSave={() => runTicketSearch(1)}
          />
        </TabPanel>

        {/* Tickets Results Panel */}
        <TabPanel item="tickets">
          <TicketsTab
            tickets={tickets}
            totalCount={totalCount}
            loading={loading}
            error={error}
            currentPage={currentPage}
            pageSize={pageSize}
            onChangePage={(page) => runTicketSearch(page)}
            selectedColumns={selectedColumns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            allFields={fields}
            usersCache={usersCache}
            groupsCache={groupsCache}
            orgsCache={orgsCache}
          />
        </TabPanel>
      </Tabs>
    </AppContainer>
  );
}
