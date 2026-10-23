import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import organizationApi from '../api/organization.api.js';
import { useAuth } from './AuthContext.jsx';

// OrganizationContext exposes the user's active org + members. We refetch on
// login so the dashboard sidebar always reflects fresh membership.
const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await organizationApi.list();
      const list = res?.data?.data || [];
      setOrganizations(list);
      setActiveOrg((prev) => prev || list[0] || null);
    } catch {
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchOrganizations();
    if (!isAuthenticated) {
      setOrganizations([]);
      setActiveOrg(null);
    }
  }, [isAuthenticated, fetchOrganizations]);

  const createOrg = useCallback(async (payload) => {
    const res = await organizationApi.create(payload);
    const org = res?.data?.data;
    if (org) {
      setOrganizations((prev) => [...prev, org]);
      setActiveOrg(org);
    }
    return org;
  }, []);

  const inviteMember = useCallback(
    async (orgId, payload) => {
      const res = await organizationApi.invite(orgId, payload);
      await fetchOrganizations();
      return res?.data?.data;
    },
    [fetchOrganizations],
  );

  const value = {
    organizations,
    activeOrg,
    setActiveOrg,
    loading,
    fetchOrganizations,
    createOrg,
    inviteMember,
  };

  return (
    <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within an OrganizationProvider.');
  return ctx;
}

export default OrganizationContext;
