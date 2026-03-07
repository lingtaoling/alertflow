import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { usersApi } from '../../../services/users.service';
import { orgsApi } from '../../../services/organizations.service';
import { Organization } from '../../../types';
import ModalForm from '../../../components/ui/ModalForm';
import FormField from '../../../components/ui/FormField';
import { UserPlus, Zap } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateUserForm({ onClose, onSuccess }: Props) {
  const { orgId } = useAppSelector((s) => s.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgIdVal, setOrgIdVal] = useState(orgId ?? '');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = !orgId;
  const effectiveOrgId = isAdmin ? orgIdVal : orgId;

  useEffect(() => {
    if (isAdmin) {
      orgsApi.list().then(setOrgs).catch(() => setOrgs([]));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (orgs.length > 0 && !orgIdVal) setOrgIdVal(orgs[0].id);
  }, [orgs, orgIdVal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !effectiveOrgId) return;
    setError('');
    setLoading(true);
    try {
      await usersApi.create({ name: name.trim(), email: email.trim().toLowerCase(), orgId: effectiveOrgId, password });
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const isValid = name.trim() && email.trim() && password.length >= 8 && (isAdmin ? orgIdVal : true);

  return (
    <ModalForm
      title="Create User"
      icon={<UserPlus size={16} className="text-signal-orange" />}
      onClose={onClose}
      error={error || undefined}
      submitLabel="Create User"
      loadingLabel="Creating..."
      loading={loading}
      submitDisabled={!isValid}
      onSubmit={handleSubmit}
      submitIcon={<Zap size={14} />}
    >
      <FormField name="name" label="Full name" type="text" required placeholder="John Doe" value={name} onChange={setName} autoFocus />
      <FormField name="email" label="Email address" type="email" required placeholder="john@acme.com" value={email} onChange={setEmail} />
      <FormField name="password" label="Password" type="password" required placeholder="Min 8 characters" value={password} onChange={setPassword} minLength={8} />
      {isAdmin && (
        <FormField
          name="orgId"
          label="Organization"
          type="select"
          required
          value={orgIdVal}
          onChange={setOrgIdVal}
          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
        />
      )}
    </ModalForm>
  );
}
