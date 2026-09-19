export function registerResources(server, db) {
  // 1. Current Active Firm
  server.resource(
    'current-firm',
    'retailflow://firms/current',
    {
      description: 'Profile, legal tax details, and payment coordinates of the active business entity',
      mimeType: 'application/json',
    },
    async (uri) => {
      const firm = db.getActiveFirm();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(firm, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  );

  // 2. Financial Metrics Summary
  server.resource(
    'metrics-summary',
    'retailflow://metrics/summary',
    {
      description: 'Real-time billing, turnover volume, and outstanding receivables snapshot',
      mimeType: 'application/json',
    },
    async (uri) => {
      const summary = db.getBillingSummary();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(summary, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  );

  // 3. Low Stock Items
  server.resource(
    'low-stock-feed',
    'retailflow://inventory/low-stock',
    {
      description: 'Inventory items whose stock count has fallen below alert thresholds',
      mimeType: 'application/json',
    },
    async (uri) => {
      const items = db.getInventory({ lowStockOnly: true });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(items, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  );
}
