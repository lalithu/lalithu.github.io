(() => {
  if (location.origin !== 'https://lalithu.github.io' ||
      !/^\/demo\/storytime\/?$/.test(location.pathname) ||
      navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  // A dedicated private visit table. No query strings, codes, or demo events leave the browser.
  const endpoint = 'https://qbpyclyaxmingibovdli.supabase.co/functions/v1/track-storytime-demo-visit';
  fetch(endpoint, { method: 'POST', keepalive: true, credentials: 'omit' }).catch(() => {});
})();
