(() => {
  if (location.origin !== 'https://lalithu.github.io' ||
      /^\/mortgage-ops-lab(?:\/|$)/.test(location.pathname) ||
      navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  const endpoint = 'https://qbpyclyaxmingibovdli.supabase.co/functions/v1/track-portfolio-visit';
  fetch(endpoint, { method: 'POST', keepalive: true, credentials: 'omit' }).catch(() => {});
})();
