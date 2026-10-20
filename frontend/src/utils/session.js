// Session helpers shared by the layouts and page guards.
//
// Login returns a signed JWT that the API client attaches to every request. The guards
// require both that token and the matching profile, so a stale profile left in
// sessionStorage without a token cannot render a protected page.

export const TOKEN_KEY = 'authToken';

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const getAdminAccount = () =>
  (getToken() ? sessionStorage.getItem('adminAccount') : null);

export const getMember = () => {
  if (!getToken()) return null;
  const raw = sessionStorage.getItem('member');
  if (!raw) return null;
  try {
    const member = JSON.parse(raw);
    return member && member.memberAccount ? member : null;
  } catch (_) {
    return null;
  }
};

export const getMemberAccount = () => {
  const member = getMember();
  return member ? member.memberAccount : null;
};

export const clearAdminSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('adminAccount');
  sessionStorage.removeItem('adminStats');
};

export const clearMemberSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('member');
};
