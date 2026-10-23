import { useEffect, useState } from 'react';
import { Loader2, Plus, Mail, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import { useOrganization } from '../../context/OrganizationContext.jsx';
import { ROLES, ROLE_LABELS } from '../../constants/index.js';
import { getInitials, colorFromString } from '../../utils/formatters.js';

export default function OrganizationSettingsPage() {
  const { organizations, activeOrg, fetchOrganizations, createOrg, inviteMember, loading } =
    useOrganization();
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ROLES.INTERVIEWER);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleCreate = async () => {
    if (!newOrgName.trim()) {
      toast.error('Enter a name.');
      return;
    }
    try {
      await createOrg({ name: newOrgName.trim() });
      toast.success('Organization created.');
      setNewOrgName('');
      setCreateOpen(false);
    } catch {
      // toast handled by interceptor
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !activeOrg) return;
    try {
      await inviteMember(activeOrg.id, { email: inviteEmail, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail('');
      setInviteOpen(false);
    } catch {
      // toast handled by interceptor
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Organization</h1>
          <p className="text-sm text-slate-500">Manage your organization, members, and invitations.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New organization
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading…</span>
        </div>
      ) : organizations.length === 0 ? (
        <div className="card p-6 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="mt-3 text-sm font-semibold text-slate-100">No organization yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Create one to invite team members and share a question bank.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => (
            <div key={org.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{org.name}</h3>
                  <p className="text-xs text-slate-500">
                    {org.members?.length || 0} member(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="btn-secondary text-xs"
                >
                  <Mail className="h-3.5 w-3.5" /> Invite
                </button>
              </div>
              <ul className="mt-4 divide-y divide-slate-800">
                {(org.members || []).map((m) => {
                  const dot = colorFromString(m.email || m.name);
                  return (
                    <li key={m.id || m.email} className="flex items-center gap-3 py-2">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ${dot}`}
                      >
                        {getInitials(m.name || m.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-100">{m.name}</p>
                        <p className="truncate text-xs text-slate-500">{m.email}</p>
                      </div>
                      <span className="badge bg-slate-800 text-slate-300">
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </li>
                  );
                })}
                {(!org.members || org.members.length === 0) && (
                  <li className="py-4 text-center text-xs text-slate-500">No members yet.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Create org modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create organization"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button type="button" onClick={handleCreate} className="btn-primary text-sm">
              Create
            </button>
          </>
        }
      >
        <Input
          label="Organization name"
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          placeholder="Acme Engineering"
          autoFocus
        />
      </Modal>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={`Invite to ${activeOrg?.name || ''}`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button type="button" onClick={handleInvite} className="btn-primary text-sm">
              Send invite
            </button>
          </>
        }
      >
        <Input
          label="Email"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="teammate@company.com"
          autoFocus
        />
        <Select
          label="Role"
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          options={[
            { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
            { value: ROLES.INTERVIEWER, label: ROLE_LABELS[ROLES.INTERVIEWER] },
            { value: ROLES.CANDIDATE, label: ROLE_LABELS[ROLES.CANDIDATE] },
          ]}
          className="mt-4"
        />
      </Modal>
    </div>
  );
}
