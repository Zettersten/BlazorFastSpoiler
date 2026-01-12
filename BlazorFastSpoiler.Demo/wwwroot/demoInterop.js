// Demo-only JS helpers (no eval, CSP-friendly).
(function () {
  const api = {
    highlightAll: function () {
      if (window.Prism && typeof window.Prism.highlightAll === 'function') {
        window.Prism.highlightAll();
      }
    }
  };

  window.BlazorFastSpoilerDemo = api;
})();

