import { useState } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { setSession } from '../../../store/slices/authSlice';
import { authApi } from '../../../services/auth.service';

export function useLoginForm() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('tester1@demo.com');
  const [password, setPassword] = useState('Demouser123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const { accessToken, user, org } = await authApi.login(email.trim(), password);
      dispatch(setSession({ accessToken, org, user }));
    } catch (e: any) {
      setError(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, loading, error, handleSubmit };
}
