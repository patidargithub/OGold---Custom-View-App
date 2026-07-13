import { useState, useEffect } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs';
import { useClient } from '../hooks/useClient';
import { fetchTicketFields, searchTickets, buildSearchQuery, requestWithRetry, updateAppInstallationSettings, fetchCustomStatuses, fetchBrands, searchTicketsCount, setupUserFilterPreferenceCustomObject, fetchUserFilterPreference, saveUserFilterPreference, fetchCustomRoles } from '../services/zendeskApi';
import SettingsTab from '../components/SettingsTab';
import TicketsTab from '../components/TicketsTab';
import AccessControlTab from '../components/AccessControlTab';
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
  overflow: visible !important;
`;

const StyledTabPanel = styled(TabPanel)`
  flex: 1;
  padding-top: 12px;
  box-sizing: border-box;
  overflow: visible !important;
  
  &[data-selected="true"] {
    display: flex;
    flex-direction: column;
  }
`;

export default function NavBarApp() {
  const client = useClient();

  // Layout state
  const [activeTab, setActiveTab] = useState('tickets');
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasSettingsAccess, setHasSettingsAccess] = useState(false);

  // Access control selections state
  const [customRoles, setCustomRoles] = useState([]);
  const [accessRoles, setAccessRoles] = useState([]);
  const [accessGroups, setAccessGroups] = useState([]);
  const [accessUsers, setAccessUsers] = useState([]);
  const [adminRoleId, setAdminRoleId] = useState('admin');

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

        // Fetch current user properties from ZAF
        const currentUserRes = await client.get('currentUser');
        const currentUser = currentUserRes.currentUser || {};
        const userId = currentUser.id;
        const userRole = currentUser.role;
        const userGroups = currentUser.groups || [];
        const adminUser = userRole === 'admin';
        setIsAdmin(adminUser);

        // Fetch custom_role_id from REST API for custom role support
        let customRoleId = null;
        try {
          const meRes = await requestWithRetry(client, {
            url: '/api/v2/users/me.json',
            type: 'GET',
            dataType: 'json'
          });
          if (meRes && meRes.user) {
            customRoleId = meRes.user.custom_role_id;
          }
        } catch (e) {
          console.error('Failed to fetch custom_role_id:', e);
        }

        // Fetch all custom roles from Zendesk REST API
        const customRolesFetched = await fetchCustomRoles(client);
        setCustomRoles(customRolesFetched);

        // Find system admin custom role if it exists in the fetched list
        const systemAdminRole = customRolesFetched.find(r => 
          r.name.toLowerCase() === 'admin' || 
          r.name.toLowerCase() === 'administrator'
        );
        const resolvedAdminRoleId = systemAdminRole ? systemAdminRole.id.toString() : 'admin';
        setAdminRoleId(resolvedAdminRoleId);

        // Fetch ZAF metadata settings
        const metadata = await client.metadata();
        const settings = metadata.settings || {};

        // Parse access control configurations from settings
        const loadedAccessRoles = settings.access_roles ? settings.access_roles.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!loadedAccessRoles.includes(resolvedAdminRoleId)) {
          loadedAccessRoles.push(resolvedAdminRoleId);
        }
        if (resolvedAdminRoleId !== 'admin' && loadedAccessRoles.includes('admin')) {
          const idx = loadedAccessRoles.indexOf('admin');
          loadedAccessRoles.splice(idx, 1);
        }
        const loadedAccessGroups = settings.access_groups ? settings.access_groups.split(',').map(s => s.trim()).filter(Boolean) : [];
        const loadedAccessUsers = settings.access_users ? settings.access_users.split(',').map(s => s.trim()).filter(Boolean) : [];

        setAccessRoles(loadedAccessRoles);
        setAccessGroups(loadedAccessGroups);
        setAccessUsers(loadedAccessUsers);

        // Access check
        const hasAccess = 
          adminUser || 
          loadedAccessRoles.includes(userRole) || 
          (customRoleId && loadedAccessRoles.includes(customRoleId.toString())) ||
          userGroups.some(g => loadedAccessGroups.includes(g.id.toString())) ||
          (userId && loadedAccessUsers.includes(userId.toString()));

        setHasSettingsAccess(hasAccess);

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

        // Ensure Custom Object setup exists (only admins can create definitions, but non-admins can run lookups)
        try {
          await setupUserFilterPreferenceCustomObject(client);
        } catch (e) {
          console.warn('Custom object definition setup bypassed or failed:', e);
        }

        // Fetch current user and restore filters
        let restoredFilters = [];
        try {
          const userRes = await client.get('currentUser.id');
          const userId = userRes['currentUser.id'];
          if (userId) {
            const savedRecord = await fetchUserFilterPreference(client, userId);
            if (savedRecord && savedRecord.custom_object_fields && savedRecord.custom_object_fields.preferences_json) {
              restoredFilters = JSON.parse(savedRecord.custom_object_fields.preferences_json);
              console.log('Restored filters from Zendesk Custom Object:', restoredFilters);
            }
          }
        } catch (e) {
          console.error('Failed to restore filters from Custom Object:', e);
        }

        // Apply filters state
        if (restoredFilters.length > 0) {
          setFilters(restoredFilters);
          await runTicketSearch(1, null, null, restoredFilters);
        } else {
          // If no saved filters, run initial ticket search with empty filter conditions
          await runTicketSearch(1);
        }

      } catch (err) {
        console.error('Failed to load initial Zendesk metadata:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  // Main search function
  const runTicketSearch = async (page = 1, forceSortField = null, forceSortDir = null, overrideFilters = null, skipFetchCounts = false) => {
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
      let apiSortBy = serverSortable.includes(activeSortField) ? activeSortField : 'created_at';
      if (apiSortBy === 'type') {
        apiSortBy = 'ticket_type';
      }
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

      // Fetch main page results using the general search tickets API
      // and status metrics counts in parallel using the status-specific search count API
      const [result, ...kpiResults] = await Promise.all([
        searchTickets(client, {
          query,
          page,
          perPage: pageSize,
          sortBy: apiSortBy,
          sortOrder: apiSortOrder
        }),
        ...(skipFetchCounts ? [] : statusesToFetch.map(async (stat) => {
          try {
            const count = await searchTicketsCount(client, `${baseKpiQuery} status:${stat}`);
            return { status: stat, count };
          } catch (e) {
            console.error(`Failed to fetch KPI count for status ${stat}:`, e);
            return { status: stat, count: 0 };
          }
        }))
      ]);

      if (!skipFetchCounts) {
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
      }

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
    const serverSortable = ['created_at', 'updated_at', 'priority', 'status', 'type'];
    if (!serverSortable.includes(field)) {
      let label = field;
      if (field === 'id') label = 'ID';
      else if (field === 'subject') label = 'Subject';
      else if (field === 'satisfaction') label = 'Satisfaction';
      else if (field === 'support_type') label = 'Support Type';
      else if (field === 'group_id') label = 'Group';
      else if (field === 'assignee_id') label = 'Assignee';
      else if (field === 'requester_id') label = 'Requester';
      else if (field.startsWith('custom_field_')) {
        const id = parseInt(field.replace('custom_field_', ''), 10);
        const matched = fields.find(f => f.id === id);
        label = matched ? matched.title : 'Custom Field';
      }

      if (client) {
        client.trigger('notify', {
          type: 'warning',
          text: `Sorting is not available for the "${label}" column.`
        });
      }
      return;
    }

    const newDir = (sortField === field && sortDirection === 'desc') ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDir);

    // Call the search API and request the sorted data directly from the Zendesk database
    setTimeout(() => {
      runTicketSearch(1, field, newDir, null, true);
    }, 0);
  };

  const handleSaveSettings = async () => {
    if (!client) return;
    setLoading(true);

    try {
      // Compile settings payload to save in Zendesk Admin Center
      const finalRoles = accessRoles.includes(adminRoleId) ? accessRoles : [adminRoleId, ...accessRoles];
      const newSettings = {
        columns_config: selectedColumns.join(','),
        page_size: pageSize.toString(),
        default_sort_field: sortField,
        default_sort_direction: sortDirection,
        access_roles: finalRoles.join(','),
        access_groups: accessGroups.join(','),
        access_users: accessUsers.join(',')
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
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccessSettings = async (roles, groups, users) => {
    if (!client) return;
    setLoading(true);

    try {
      const finalRoles = roles.includes(adminRoleId) ? roles : [adminRoleId, ...roles];
      const newSettings = {
        columns_config: selectedColumns.join(','),
        page_size: pageSize.toString(),
        default_sort_field: sortField,
        default_sort_direction: sortDirection,
        access_roles: finalRoles.join(','),
        access_groups: groups.join(','),
        access_users: users.join(',')
      };

      await updateAppInstallationSettings(client, newSettings);

      setAccessRoles(finalRoles);
      setAccessGroups(groups);
      setAccessUsers(users);

      // Recheck access
      const currentUserRes = await client.get('currentUser');
      const currentUser = currentUserRes.currentUser || {};
      const userId = currentUser.id;
      const userRole = currentUser.role;
      const userGroups = currentUser.groups || [];

      let customRoleId = null;
      try {
        const meRes = await requestWithRetry(client, {
          url: '/api/v2/users/me.json',
          type: 'GET',
          dataType: 'json'
        });
        if (meRes && meRes.user) {
          customRoleId = meRes.user.custom_role_id;
        }
      } catch (e) {
        console.error(e);
      }

      const hasAccess = 
        userRole === 'admin' || 
        roles.includes(userRole) || 
        (customRoleId && roles.includes(customRoleId.toString())) ||
        userGroups.some(g => groups.includes(g.id.toString())) ||
        (userId && users.includes(userId.toString()));
      setHasSettingsAccess(hasAccess);

      client.trigger('notify', {
        type: 'success',
        text: 'Access control settings successfully saved.'
      });
    } catch (err) {
      console.error('Failed to update access settings:', err);
      client.trigger('notify', {
        type: 'error',
        text: `Failed to save access settings: ${err.message || 'Admins only.'}`
      });
      throw err;
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
          {isAdmin && <Tab item="access">Access Control</Tab>}
          {hasSettingsAccess && <Tab item="settings">Search Settings</Tab>}
          <Tab item="tickets">Tickets ({totalCount})</Tab>
        </TabList>

        {/* Access Control Panel */}
        {isAdmin && (
          <StyledTabPanel item="access">
            <AccessControlTab
              roles={customRoles.map(r => ({ id: r.id.toString(), name: r.name }))}
              groups={groups.map(g => ({ id: g.id.toString(), name: g.name }))}
              users={users.map(u => ({ id: u.id.toString(), name: u.name }))}
              selectedRoles={accessRoles}
              selectedGroups={accessGroups}
              selectedUsers={accessUsers}
              onSave={handleSaveAccessSettings}
              adminRoleId={adminRoleId}
            />
          </StyledTabPanel>
        )}

        {/* Settings Panel */}
        {hasSettingsAccess && (
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
            onChangePage={(page) => runTicketSearch(page, null, null, null, true)}
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
            onApplyFilters={async (newFilters) => {
              setFilters(newFilters);
              runTicketSearch(1, null, null, newFilters);

              try {
                const userRes = await client.get('currentUser.id');
                const userId = userRes['currentUser.id'];
                if (userId) {
                  await saveUserFilterPreference(client, userId, newFilters);
                }
              } catch (e) {
                console.error('Failed to save filter preferences to Custom Object:', e);
              }
            }}
          />
        </StyledTabPanel>
      </StyledTabs>
    </AppContainer>
  );
}
