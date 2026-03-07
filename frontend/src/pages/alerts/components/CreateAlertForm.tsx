import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createAlert, fetchAlerts } from '../../../store/slices/alertsSlice';
import ModalForm from '../../../components/ui/ModalForm';
import FormField from '../../../components/ui/FormField';
import { Plus, Zap } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function CreateAlertForm({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const { createLoading, error, filterStatus, limit, offset } = useAppSelector((s) => s.alerts);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLocalError('');
    const result = await dispatch(createAlert({ title: title.trim(), description: description.trim() || undefined }));
    if (createAlert.fulfilled.match(result)) {
      dispatch(fetchAlerts({ status: filterStatus || undefined, limit, offset }));
      onClose();
    } else {
      setLocalError(result.payload as string);
    }
  }

  return (
    <ModalForm
      title="New Alert"
      icon={<Plus size={16} className="text-signal-orange" />}
      onClose={onClose}
      error={localError || error || undefined}
      submitLabel="Create Alert"
      loadingLabel="Creating..."
      loading={createLoading}
      submitDisabled={!title.trim()}
      onSubmit={handleSubmit}
      submitIcon={<Zap size={14} />}
    >
      <FormField
        name="title"
        label="Alert title"
        type="text"
        required
        placeholder="e.g. Database CPU spike above threshold"
        value={title}
        onChange={setTitle}
        autoFocus
        maxLength={200}
      />
      <FormField
        name="description"
        label="Description"
        type="textarea"
        optional
        placeholder="Provide additional context about this alert..."
        value={description}
        onChange={setDescription}
        rows={3}
        maxLength={2000}
      />
    </ModalForm>
  );
}
