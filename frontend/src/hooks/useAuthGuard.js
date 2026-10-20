import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminAccount, getMember } from '../utils/session';

/**
 * Redirect to the correct login screen when the session is missing.
 *
 * Before this hook only the list pages checked the session; deep links such as
 * /admin/members/add or /user/info/:account rendered their forms unauthenticated and
 * failed at submit time with a confusing error.
 *
 * Returns `ready` so a page can avoid firing its data requests (and rendering a flash of
 * empty content) before the redirect happens.
 */
export function useAuthGuard(role) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const authenticated = role === 'admin' ? !!getAdminAccount() : !!getMember();

    if (!authenticated) {
      navigate(role === 'admin' ? '/admin/login' : '/user/login', { replace: true });
      return;
    }

    setReady(true);
  }, [navigate, role]);

  return ready;
}

export default useAuthGuard;
