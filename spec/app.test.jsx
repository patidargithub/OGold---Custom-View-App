import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { ClientProvider } from '../src/app/contexts/ClientProvider'
import App from '../src/app/App'

// Mock the I18n class directly to ensure no translation lookup issues crash the JSDOM rendering
vi.mock('../src/lib/i18n', () => {
  return {
    default: class MockI18n {
      loadTranslations = () => Promise.resolve()
      t = (key) => {
        if (key === 'ticket_sidebar.title') return 'Hello from Ticket Side Bar'
        if (key === 'modal.title') return 'Hello from Modal'
        return key
      }
    }
  }
})

const mockClient = {
  on: vi.fn((event, callback) => {
    if (event === 'app.registered') {
      setTimeout(callback, 0)
    }
  }),
  get: vi.fn().mockResolvedValue({
    currentUser: {
      id: 12345,
      role: 'agent',
      groups: [{ id: 111, name: 'Support' }],
      locale: 'en'
    }
  }),
  context: vi.fn().mockResolvedValue({ location: 'ticket_sidebar' }),
  metadata: vi.fn().mockResolvedValue({
    settings: {
      columns_config: 'id,subject',
      access_roles: '9999',
      access_groups: '222',
      access_users: '55555'
    }
  }),
  invoke: vi.fn(),
  request: vi.fn().mockImplementation((options) => {
    const url = options.url || '';
    if (url.includes('/api/v2/users/me.json')) {
      return Promise.resolve({ user: { id: 12345, role: 'agent', custom_role_id: 9999 } });
    }
    if (url.includes('/api/v2/custom_roles.json')) {
      return Promise.resolve({ custom_roles: [{ id: 9999, name: 'Custom Tier 2' }] });
    }
    if (url.includes('/api/v2/ticket_fields.json')) {
      return Promise.resolve({ ticket_fields: [] });
    }
    if (url.includes('/api/v2/groups.json')) {
      return Promise.resolve({ groups: [{ id: 111, name: 'Support' }, { id: 222, name: 'Escalations' }] });
    }
    if (url.includes('/api/v2/users.json')) {
      return Promise.resolve({ users: [{ id: 12345, name: 'Test Agent' }] });
    }
    if (url.includes('/api/v2/organizations.json')) {
      return Promise.resolve({ organizations: [] });
    }
    if (url.includes('/api/v2/custom_statuses.json')) {
      return Promise.resolve({ custom_statuses: [] });
    }
    if (url.includes('/api/v2/brands.json')) {
      return Promise.resolve({ brands: [] });
    }
    if (url.includes('/custom_objects/user_filter_preference')) {
      return Promise.resolve({});
    }
    if (url.includes('/search.json')) {
      return Promise.resolve({
        results: [],
        count: 0,
        sideloads: { users: [], groups: [], organizations: [] }
      });
    }
    return Promise.resolve({});
  })
}

describe('App Components', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    document.body.innerHTML = '<div id="root"></div>'
    vi.stubGlobal('ZAFClient', {
      init: vi.fn().mockReturnValue(mockClient)
    })
  })

  it('renders TicketSideBar and shows the correct content', async () => {
    mockClient.context.mockResolvedValue({ location: 'ticket_sidebar' })
    render(
      <ClientProvider>
        <App />
      </ClientProvider>
    )

    expect(mockClient.on).toHaveBeenCalledWith('app.registered', expect.any(Function))
    await waitFor(() => expect(screen.getByText('Hello from Ticket Side Bar')).toBeDefined())
  })

  it('renders Modal and shows the correct content', async () => {
    mockClient.context.mockResolvedValue({ location: 'modal' })
    render(
      <ClientProvider>
        <App />
      </ClientProvider>
    )

    expect(mockClient.on).toHaveBeenCalledWith('app.registered', expect.any(Function))
    await waitFor(() => expect(screen.getByText('Hello from Modal')).toBeDefined())
  })

  describe('NavBarApp Location - Access Control Checks', () => {
    it('allows Zendesk Admin to see all tabs (Access Control, Search Settings, and Tickets)', async () => {
      mockClient.context.mockResolvedValue({ location: 'nav_bar' })
      mockClient.get.mockResolvedValue({
        currentUser: {
          id: 11111,
          role: 'admin',
          groups: [],
          locale: 'en'
        }
      })
      mockClient.request.mockImplementation((options) => {
        const url = options.url || '';
        if (url.includes('/api/v2/users/me.json')) {
          return Promise.resolve({ user: { id: 11111, role: 'admin', custom_role_id: null } })
        }
        return Promise.resolve({ custom_roles: [], groups: [], users: [], ticket_fields: [], results: [] })
      })

      render(
        <ClientProvider>
          <App />
        </ClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Zendesk Custom Ticket Search')).toBeDefined()
        expect(screen.getByRole('tab', { name: /Access Control/i })).toBeDefined()
        expect(screen.getByRole('tab', { name: /Search Settings/i })).toBeDefined()
        expect(screen.getByRole('tab', { name: (val) => val.includes('Tickets') })).toBeDefined()
      }, { timeout: 4000 })
    })

    it('allows matching custom role user to see Search Settings and Tickets, but NOT Access Control', async () => {
      mockClient.context.mockResolvedValue({ location: 'nav_bar' })
      mockClient.get.mockResolvedValue({
        currentUser: {
          id: 12345,
          role: 'agent',
          groups: [],
          locale: 'en'
        }
      })
      mockClient.metadata.mockResolvedValue({
        settings: {
          access_roles: '9999',
          access_groups: '',
          access_users: ''
        }
      })
      mockClient.request.mockImplementation((options) => {
        const url = options.url || '';
        if (url.includes('/api/v2/users/me.json')) {
          return Promise.resolve({ user: { id: 12345, role: 'agent', custom_role_id: 9999 } })
        }
        return Promise.resolve({ custom_roles: [{ id: 9999, name: 'Custom Tier 2' }], groups: [], users: [], ticket_fields: [], results: [] })
      })

      render(
        <ClientProvider>
          <App />
        </ClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Search Settings/i })).toBeDefined()
        expect(screen.getByRole('tab', { name: (val) => val.includes('Tickets') })).toBeDefined()
      }, { timeout: 4000 })

      expect(screen.queryByRole('tab', { name: /Access Control/i })).toBeNull()
    })

    it('allows matching user ID to see Search Settings and Tickets, but NOT Access Control', async () => {
      mockClient.context.mockResolvedValue({ location: 'nav_bar' })
      mockClient.get.mockResolvedValue({
        currentUser: {
          id: 55555,
          role: 'agent',
          groups: [],
          locale: 'en'
        }
      })
      mockClient.metadata.mockResolvedValue({
        settings: {
          access_roles: '',
          access_groups: '',
          access_users: '55555'
        }
      })
      mockClient.request.mockImplementation((options) => {
        const url = options.url || '';
        if (url.includes('/api/v2/users/me.json')) {
          return Promise.resolve({ user: { id: 55555, role: 'agent', custom_role_id: null } })
        }
        return Promise.resolve({ custom_roles: [], groups: [], users: [], ticket_fields: [], results: [] })
      })

      render(
        <ClientProvider>
          <App />
        </ClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Search Settings/i })).toBeDefined()
        expect(screen.getByRole('tab', { name: (val) => val.includes('Tickets') })).toBeDefined()
      }, { timeout: 4000 })

      expect(screen.queryByRole('tab', { name: /Access Control/i })).toBeNull()
    })

    it('allows matching group user to see Search Settings and Tickets, but NOT Access Control', async () => {
      mockClient.context.mockResolvedValue({ location: 'nav_bar' })
      mockClient.get.mockResolvedValue({
        currentUser: {
          id: 12345,
          role: 'agent',
          groups: [{ id: 222, name: 'Escalations' }],
          locale: 'en'
        }
      })
      mockClient.metadata.mockResolvedValue({
        settings: {
          access_roles: '',
          access_groups: '222',
          access_users: ''
        }
      })
      mockClient.request.mockImplementation((options) => {
        const url = options.url || '';
        if (url.includes('/api/v2/users/me.json')) {
          return Promise.resolve({ user: { id: 12345, role: 'agent', custom_role_id: null } })
        }
        return Promise.resolve({ custom_roles: [], groups: [{ id: 222, name: 'Escalations' }], users: [], ticket_fields: [], results: [] })
      })

      render(
        <ClientProvider>
          <App />
        </ClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Search Settings/i })).toBeDefined()
        expect(screen.getByRole('tab', { name: (val) => val.includes('Tickets') })).toBeDefined()
      }, { timeout: 4000 })

      expect(screen.queryByRole('tab', { name: /Access Control/i })).toBeNull()
    })

    it('restricts non-admin with no matches from seeing Access Control or Search Settings tabs', async () => {
      mockClient.context.mockResolvedValue({ location: 'nav_bar' })
      mockClient.get.mockResolvedValue({
        currentUser: {
          id: 99999,
          role: 'agent',
          groups: [{ id: 888, name: 'Other Group' }],
          locale: 'en'
        }
      })
      mockClient.metadata.mockResolvedValue({
        settings: {
          access_roles: '9999',
          access_groups: '222',
          access_users: '55555'
        }
      })
      mockClient.request.mockImplementation((options) => {
        const url = options.url || '';
        if (url.includes('/api/v2/users/me.json')) {
          return Promise.resolve({ user: { id: 99999, role: 'agent', custom_role_id: 1111 } })
        }
        return Promise.resolve({ custom_roles: [], groups: [], users: [], ticket_fields: [], results: [] })
      })

      render(
        <ClientProvider>
          <App />
        </ClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: (val) => val.includes('Tickets') })).toBeDefined()
      }, { timeout: 4000 })

      expect(screen.queryByRole('tab', { name: /Access Control/i })).toBeNull()
      expect(screen.queryByRole('tab', { name: /Search Settings/i })).toBeNull()
    })
  })
})
