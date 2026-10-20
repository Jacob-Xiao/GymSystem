// Session helpers shared by the layouts and page guards.
//
// Authentication is client-side only (the project has no JWT or server session): the
// login page stores an identifier in sessionStorage and every protected page must send
// the visitor back to the matching login screen when it is missing.

export const getAdminAccount = () => sessionStorage.getItem('adminAccount');

export const getMember = () => {
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
  sessionStorage.removeItem('adminAccount');
  sessionStorage.removeItem('adminStats');
};

export const clearMemberSession = () => {
  sessionStorage.removeItem('member');
};
