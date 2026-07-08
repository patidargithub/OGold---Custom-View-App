import { useState, useEffect } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs';
import { useClient } from '../hooks/useClient';
import { fetchTicketFields, searchTickets, buildSearchQuery, requestWithRetry, updateAppInstallationSettings, fetchCustomStatuses, fetchBrands } from '../services/zendeskApi';
import SettingsTab from '../components/SettingsTab';
import TicketsTab from '../components/TicketsTab';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: 20px;
  background: #f8fafc;
  overflow-y: auto;
`;

const AppHeader = styled.div`
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const AppTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px 0;
`;

const AppSubtitle = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0;
`;

const StyledTabs = styled(Tabs)`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const StyledTabPanel = styled(TabPanel)`
  flex: 1;
  padding-top: 12px;
  box-sizing: border-box;
  
  &[data-selected="true"] {
    display: flex;
    flex-direction: column;
  }
`;

export default function NavBarApp() {
  const client = useClient();

  // Layout state
  const [activeTab, setActiveTab] = useState('settings');
  const [isAdmin, setIsAdmin] = useState(false);

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
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [usersCache, setUsersCache] = useState({});
  const [groupsCache, setGroupsCache] = useState({});
  const [orgsCache, setOrgsCache] = useState({});
  const [customStatuses, setCustomStatuses] = useState([]);
  const [brands, setBrands] = useState([]);

  // Search results state
  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [subdomain, setSubdomain] = useState('');
  const [kpiCounts, setKpiCounts] = useState({
    new: 0,
    open: 0,
    pending: 0,
    hold: 0,
    solved: 0,
    closed: 0
  });

  // Initialize and load metadata on startup
  useEffect(() => {
    async function loadMetadata() {
      if (!client) return;

      try {
        setLoading(true);

        // Fetch current user's role and restrict access to settings
        const roleRes = await client.get('currentUser.role');
        const userRole = roleRes['currentUser.role'];
        const adminUser = userRole === 'admin';
        setIsAdmin(adminUser);

        // If user is not an admin, land them on tickets tab by default
        if (!adminUser) {
          setActiveTab('tickets');
        }

        // Fetch ZAF metadata settings
        const metadata = await client.metadata();
        const settings = metadata.settings || {};

        // Fetch client context to resolve account subdomain
        const context = await client.context();
        if (context && context.account) {
          setSubdomain(context.account.subdomain);
        }

        // Load columns_config from app installation settings
        if (settings.columns_config) {
          const configCols = settings.columns_config.split(',').map(s => s.trim()).filter(Boolean);
          if (configCols.length > 0) {
            setSelectedColumns(configCols);
          }
        }

        // Load page_size
        if (settings.page_size) {
          const size = parseInt(settings.page_size, 10);
          if (!isNaN(size)) {
            setPageSize(size);
          }
        }

        // Load default sort field and direction
        if (settings.default_sort_field) {
          setSortField(settings.default_sort_field);
        }
        if (settings.default_sort_direction) {
          setSortDirection(settings.default_sort_direction);
        }

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

        // Fetch users (agents and admins) to resolve IDs and enable dropdown searching
        const usersRes = await requestWithRetry(client, {
          url: '/api/v2/users.json?role[]=agent&role[]=admin',
          type: 'GET',
          dataType: 'json'
        });
        const fetchedUsers = usersRes.users || [];
        setUsers(fetchedUsers);

        const uCache = {};
        fetchedUsers.forEach(u => {
          uCache[u.id] = u.name;
        });
        setUsersCache(uCache);

        // Fetch organizations
        const orgsRes = await requestWithRetry(client, {
          url: '/api/v2/organizations.json',
          type: 'GET',
          dataType: 'json'
        });
        const fetchedOrgs = orgsRes.organizations || [];
        setOrgs(fetchedOrgs);

        const oCache = {};
        fetchedOrgs.forEach(o => {
          oCache[o.id] = o.name;
        });
        setOrgsCache(oCache);

        // Fetch active custom ticket statuses
        const fetchedCustomStatuses = await fetchCustomStatuses(client);
        setCustomStatuses(fetchedCustomStatuses);

        // Fetch brands
        const fetchedBrands = await fetchBrands(client);
        setBrands(fetchedBrands);

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
  const runTicketSearch = async (page = 1, forceSortField = null, forceSortDir = null, overrideFilters = null) => {
    if (!client) return;
    setLoading(true);
    setError(null);

    const activeSortField = forceSortField !== null ? forceSortField : sortField;
    const activeSortDir = forceSortDir !== null ? forceSortDir : sortDirection;
    const activeFilters = overrideFilters !== null ? overrideFilters : filters;

    try {
      let query = buildSearchQuery(activeFilters);

      // Ensure ticket fields metadata is loaded to resolve the "Support Type" field ID
      let activeFields = fields;
      if (activeFields.length === 0) {
        try {
          activeFields = await fetchTicketFields(client);
          setFields(activeFields);
        } catch (e) {
          console.error('Failed to load fields dynamically during search:', e);
        }
      }

      // Exclude tickets with "support type is ai agent" at the query level
      query += ' -support_type:ai_agent';

      const serverSortable = ['created_at', 'updated_at', 'priority', 'status', 'type'];
      const apiSortBy = serverSortable.includes(activeSortField) ? activeSortField : 'created_at';
      const apiSortOrder = serverSortable.includes(activeSortField) ? activeSortDir : 'desc';

      // Determine if a status condition is specified in the filter
      const statusFilter = activeFilters.find(f => f.field === 'status');
      let statusesToFetch = ['new', 'open', 'pending', 'hold', 'solved', 'closed'];
      if (statusFilter && statusFilter.values && statusFilter.values.length > 0) {
        if (statusFilter.operator === '=') {
          statusesToFetch = statusFilter.values.map(v => v.toLowerCase());
        } else if (statusFilter.operator === '!=') {
          const excludedValues = statusFilter.values.map(v => v.toLowerCase());
          statusesToFetch = ['new', 'open', 'pending', 'hold', 'solved', 'closed'].filter(s => !excludedValues.includes(s));
        }
      }

      // Build a base query for KPI cards that EXCLUDES the active status filters
      // This prevents Zendesk's OR query parser from combining counts when multiple statuses are selected
      const kpiFilters = activeFilters.filter(f => f.field !== 'status');
      let baseKpiQuery = buildSearchQuery(kpiFilters);
      baseKpiQuery += ' -support_type:ai_agent';

      // Fetch main page results and status metrics counts in parallel
      const [result, ...kpiResults] = await Promise.all([
        searchTickets(client, {
          query,
          page,
          perPage: pageSize,
          sortBy: apiSortBy,
          sortOrder: apiSortOrder
        }),
        ...statusesToFetch.map(async (stat) => {
          try {
            const res = await searchTickets(client, {
              query: `${baseKpiQuery} status:${stat}`,
              page: 1,
              perPage: 1,
              sortBy: 'created_at',
              sortOrder: 'desc'
            });
            return { status: stat, count: res.count };
          } catch (e) {
            console.error(`Failed to fetch KPI count for status ${stat}:`, e);
            return { status: stat, count: 0 };
          }
        })
      ]);

      const newKpiCounts = {
        new: 0,
        open: 0,
        pending: 0,
        hold: 0,
        solved: 0,
        closed: 0
      };
      kpiResults.forEach(r => {
        if (r.status in newKpiCounts) {
          newKpiCounts[r.status] = r.count;
        }
      });
      setKpiCounts(newKpiCounts);

      // Double-layer client-side filter to verify no matching tickets are rendered
      const cleanTickets = (result.tickets || []).filter(ticket => {
        if (ticket.support_type === 'ai_agent') {
          return false;
        }
        const tags = ticket.tags || [];
        const hasAgentTag = tags.some(tag => ['support_type_ai_agent', 'ai_agent'].includes(tag.toLowerCase()));
        if (hasAgentTag) {
          return false;
        }
        return true;
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
      setTickets(cleanTickets);
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

  const handleSaveSettings = async () => {
    if (!client) return;
    setLoading(true);

    try {
      // Compile settings payload to save in Zendesk Admin Center
      const newSettings = {
        columns_config: selectedColumns.join(','),
        page_size: pageSize.toString(),
        default_sort_field: sortField,
        default_sort_direction: sortDirection
      };

      // Call Zendesk API to update app settings
      await updateAppInstallationSettings(client, newSettings);

      // Trigger success notification
      client.trigger('notify', {
        type: 'success',
        text: 'App settings successfully saved and applied to all agents.'
      });

      // Re-trigger search to update table view with new page size and default sort
      await runTicketSearch(1);
      setActiveTab('tickets');
    } catch (err) {
      console.error('Failed to update app settings:', err);
      client.trigger('notify', {
        type: 'error',
        text: `Failed to save settings: ${err.message || 'Admins only.'}`
      });
      // Re-trigger search locally anyway so the user can see changes in current tab
      runTicketSearch(1);
      setActiveTab('tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!client || tickets.length === 0) return;
    setExporting(true);

    try {
      let query = buildSearchQuery(filters);

      // Ensure ticket fields metadata is loaded to resolve the "Support Type" field ID
      let activeFields = fields;
      if (activeFields.length === 0) {
        try {
          activeFields = await fetchTicketFields(client);
          setFields(activeFields);
        } catch (e) {
          console.error('Failed to load fields dynamically during export:', e);
        }
      }

      const supportField = activeFields.find(f => f.title && f.title.toLowerCase() === 'support type');
      if (supportField) {
        query += ` -custom_field_${supportField.id}:agent -custom_field_${supportField.id}:"ai agent" -custom_field_${supportField.id}:ai_agent`;
      } else {
        query += ' -tags:support_type_agent -tags:support_type_ai_agent -tags:ai_agent';
      }

      let allExportTickets = [];
      const totalPagesToFetch = Math.min(10, Math.ceil(totalCount / 100)); // Cap to Zendesk's 1,000 records search limit

      const newUsers = { ...usersCache };
      const newGroups = { ...groupsCache };
      const newOrgs = { ...orgsCache };

      // Load matching tickets pages in blocks of 100 to reduce HTTP calls
      for (let page = 1; page <= totalPagesToFetch; page++) {
        const result = await searchTickets(client, {
          query,
          page,
          perPage: 100,
          sortBy: 'created_at',
          sortOrder: 'desc'
        });

        if (result.tickets && result.tickets.length > 0) {
          allExportTickets = [...allExportTickets, ...result.tickets];
        }

        // Gather side-loaded caches
        result.sideloads.users.forEach(u => { newUsers[u.id] = u.name; });
        result.sideloads.groups.forEach(g => { newGroups[g.id] = g.name; });
        result.sideloads.organizations.forEach(o => { newOrgs[o.id] = o.name; });
      }

      // Update name stores
      setUsersCache(newUsers);
      setGroupsCache(newGroups);
      setOrgsCache(newOrgs);

      // 1. Exclude AI agents and agent tickets client-side
      const finalTickets = allExportTickets.filter(ticket => {
        if (supportField) {
          const customField = (ticket.custom_fields || []).find(cf => cf.id === supportField.id);
          if (customField) {
            const val = (customField.value || '').toString().toLowerCase();
            if (val === 'agent' || val === 'ai agent' || val === 'ai_agent' || val === 'support_type_agent' || val === 'support_type_ai_agent') {
              return false;
            }
          }
        }
        const tags = ticket.tags || [];
        const hasAgentTag = tags.some(tag => ['support_type_agent', 'support_type_ai_agent', 'ai_agent'].includes(tag.toLowerCase()));
        if (hasAgentTag) {
          return false;
        }
        return true;
      });

      // 2. Apply active client-side sorting configuration
      finalTickets.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === 'group_id') {
          valA = newGroups[a.group_id] || '';
          valB = newGroups[b.group_id] || '';
        } else if (sortField === 'assignee_id') {
          valA = newUsers[a.assignee_id] || '';
          valB = newUsers[b.assignee_id] || '';
        } else if (sortField === 'requester_id') {
          valA = newUsers[a.requester_id] || '';
          valB = newUsers[b.requester_id] || '';
        } else if (sortField.startsWith('custom_field_')) {
          const id = parseInt(sortField.replace('custom_field_', ''), 10);
          const cfA = (a.custom_fields || []).find(cf => cf.id === id);
          const cfB = (b.custom_fields || []).find(cf => cf.id === id);
          valA = cfA ? cfA.value : '';
          valB = cfB ? cfB.value : '';

          const matchedField = activeFields.find(f => f.id === id);
          if (matchedField && matchedField.type === 'tagger' && matchedField.custom_field_options) {
            const optA = matchedField.custom_field_options.find(opt => opt.value === valA);
            const optB = matchedField.custom_field_options.find(opt => opt.value === valB);
            valA = optA ? optA.name : (valA || '');
            valB = optB ? optB.name : (valB || '');
          }
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const strA = valA.toString().toLowerCase();
        const strB = valB.toString().toLowerCase();

        if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      // Helper functions for headers and cell formatting
      const getCSVLabel = (colKey) => {
        if (colKey === 'id') return 'ID';
        if (colKey === 'subject') return 'Subject';
        if (colKey === 'status') return 'Status';
        if (colKey === 'priority') return 'Priority';
        if (colKey === 'type') return 'Type';
        if (colKey === 'created_at') return 'Created At';
        if (colKey === 'updated_at') return 'Updated At';
        if (colKey === 'group_id') return 'Group';
        if (colKey === 'assignee_id') return 'Assignee';
        if (colKey === 'requester_id') return 'Requester';
        if (colKey.startsWith('custom_field_')) {
          const id = parseInt(colKey.replace('custom_field_', ''), 10);
          const matched = activeFields.find(f => f.id === id);
          return matched ? matched.title : colKey;
        }
        return colKey;
      };

      const getCSVValue = (ticket, colKey) => {
        const val = ticket[colKey];
        if (colKey === 'created_at' || colKey === 'updated_at') {
          return val ? new Date(val).toLocaleString() : '';
        }
        if (colKey === 'group_id') {
          return newGroups[ticket.group_id] || '';
        }
        if (colKey === 'assignee_id') {
          return newUsers[ticket.assignee_id] || '';
        }
        if (colKey === 'requester_id') {
          return newUsers[ticket.requester_id] || '';
        }
        if (colKey.startsWith('custom_field_')) {
          const id = parseInt(colKey.replace('custom_field_', ''), 10);
          const customField = (ticket.custom_fields || []).find(cf => cf.id === id);
          if (!customField || customField.value === null || customField.value === undefined) {
            return '';
          }
          const matchedField = activeFields.find(f => f.id === id);
          if (matchedField && matchedField.type === 'tagger' && matchedField.custom_field_options) {
            const option = matchedField.custom_field_options.find(opt => opt.value === customField.value);
            return option ? option.name : customField.value;
          }
          if (typeof customField.value === 'boolean') {
            return customField.value ? 'True' : 'False';
          }
          return customField.value.toString();
        }
        return val !== undefined && val !== null ? val.toString() : '';
      };

      const escapeCSV = (val) => {
        if (val === undefined || val === null) return '';
        const str = val.toString();
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // 3. Construct CSV
      const headers = selectedColumns.map(col => getCSVLabel(col)).join(',');
      const rows = finalTickets.map(ticket => {
        return selectedColumns.map(col => escapeCSV(getCSVValue(ticket, col))).join(',');
      });
      const csvContent = '\uFEFF' + [headers, ...rows].join('\n');

      // 4. Download file trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `custom_search_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      client.trigger('notify', {
        type: 'success',
        text: `Successfully exported ${finalTickets.length} tickets to CSV.`
      });

    } catch (err) {
      console.error('Error exporting CSV:', err);
      client.trigger('notify', {
        type: 'error',
        text: `Export failed: ${err.message || 'Unknown network error.'}`
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppContainer>
      <AppHeader>
        <AppTitle>Zendesk Custom Ticket Search</AppTitle>
        <AppSubtitle>Build complex multi-value searches across standard and custom fields</AppSubtitle>
      </AppHeader>

      <StyledTabs selectedItem={activeTab} onChange={setActiveTab}>
        <TabList style={{ marginBottom: '8px', flexShrink: 0 }}>
          {isAdmin && <Tab item="settings">Search Settings</Tab>}
          <Tab item="tickets">Tickets ({totalCount})</Tab>
        </TabList>

        {/* Settings Panel */}
        {isAdmin && (
          <StyledTabPanel item="settings">
            <SettingsTab
              selectedColumns={selectedColumns}
              onChangeSelectedColumns={setSelectedColumns}
              pageSize={pageSize}
              onChangePageSize={setPageSize}
              defaultSortField={sortField}
              onChangeDefaultSortField={setSortField}
              defaultSortDirection={sortDirection}
              onChangeDefaultSortDirection={setSortDirection}
              fields={fields}
              onSave={handleSaveSettings}
            />
          </StyledTabPanel>
        )}

        {/* Tickets Results Panel */}
        <StyledTabPanel item="tickets">
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
            onExportCSV={handleExportCSV}
            exporting={exporting}
            kpiCounts={kpiCounts}
            filters={filters}
            onChangeFilters={setFilters}
            groups={groups}
            users={users}
            organizations={orgs}
            customStatuses={customStatuses}
            brands={brands}
            subdomain={subdomain}
            onApplyFilters={(newFilters) => {
              setFilters(newFilters);
              runTicketSearch(1, null, null, newFilters);
            }}
          />
        </StyledTabPanel>
      </StyledTabs>
    </AppContainer>
  );
}
