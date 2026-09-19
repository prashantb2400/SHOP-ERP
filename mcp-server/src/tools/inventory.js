import { z } from 'zod';

export function registerInventoryTools(server, db) {
  // 1. List Inventory
  server.tool(
    'list_inventory',
    'Search and query catalog products, stock counts, selling prices, tax rates, and low-stock alerts.',
    {
      search: z.string().optional().describe('Search by product title or SKU code'),
      category: z.string().optional().describe('Filter by product category (e.g. Electronics, Accessories)'),
      low_stock_only: z.boolean().default(false).describe('Filter to only items below their replenishment alert threshold'),
    },
    async ({ search, category, low_stock_only }) => {
      try {
        const items = db.getInventory({ search, category, lowStockOnly: low_stock_only });
        return {
          content: [
            {
              type: 'text',
              text: `Found ${items.length} inventory item(s):\n\n` +
                items
                  .map((i) => {
                    const isLow = (Number(i.stock) || 0) <= (Number(i.low_stock_alert) || 5);
                    const alertBadge = isLow ? ' ⚠️ [LOW STOCK]' : '';
                    return `• ${i.name} (${i.sku || 'No SKU'}): ${i.stock} ${i.unit || 'pcs'} in stock @ ₹${i.rate} (GST ${i.gst_rate}%)${alertBadge}`;
                  })
                  .join('\n') +
                `\n\nFull Catalog Data:\n${JSON.stringify(items, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to list inventory: ${err.message}` }],
        };
      }
    }
  );

  // 2. Get Inventory Item
  server.tool(
    'get_inventory_item',
    'Look up full specifications, SKU, MRP, wholesale rate, and current stock for an item by ID, name, or SKU.',
    {
      id_or_name: z.string().describe('Item ID, exact title, or SKU code'),
    },
    async ({ id_or_name }) => {
      try {
        const item = db.getInventoryItem(id_or_name);
        if (!item) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Inventory item "${id_or_name}" not found.` }],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(item, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch item: ${err.message}` }],
        };
      }
    }
  );

  // 3. Add Inventory Item
  server.tool(
    'add_inventory_item',
    'Register a new product or service SKU into the ERP inventory master.',
    {
      name: z.string().describe('Product or service title'),
      sku: z.string().optional().describe('Unique stock keeping unit code'),
      rate: z.number().nonnegative().describe('Base selling price (excluding GST)'),
      mrp: z.number().nonnegative().optional().describe('Maximum Retail Price'),
      stock: z.number().nonnegative().default(0).describe('Opening stock quantity on hand'),
      gst_rate: z.number().default(18).describe('Applicable GST rate percentage (0, 5, 12, 18, 28)'),
      hsn: z.string().optional().describe('HSN / SAC code'),
      category: z.string().optional().default('General').describe('Category or department'),
      unit: z.string().default('pcs').describe('Measurement unit (e.g. pcs, kg, box, litre)'),
      low_stock_alert: z.number().default(5).describe('Minimum stock quantity before alert is triggered'),
      godown: z.string().default('Main').describe('Warehouse / godown location'),
    },
    async (params) => {
      try {
        const item = await db.addInventoryItem(params);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Added product "${item.name}" (SKU: ${item.sku}) with ${item.stock} ${item.unit} @ ₹${item.rate}.\n\nItem ID: ${item.id}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to add inventory item: ${err.message}` }],
        };
      }
    }
  );

  // 4. Update Stock
  server.tool(
    'update_stock',
    'Adjust physical stock level for an inventory SKU (positive to add received inventory, negative to record shrinkage/adjustment).',
    {
      item_id_or_name: z.string().describe('Item ID, title, or SKU'),
      quantity_delta: z.number().describe('Delta to adjust (e.g. +50 for restock or -5 for damaged goods)'),
      reason: z.string().optional().default('Manual Adjustment').describe('Audit log remark for this adjustment'),
    },
    async ({ item_id_or_name, quantity_delta, reason }) => {
      try {
        const item = db.getInventoryItem(item_id_or_name);
        if (!item) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Item "${item_id_or_name}" not found.` }],
          };
        }
        const res = await db.updateStock(item.id, quantity_delta, reason);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Stock updated for "${item.name}":\n` +
                    `• Previous Stock: ${res.prevStock} ${item.unit}\n` +
                    `• Adjusted By: ${quantity_delta > 0 ? '+' : ''}${quantity_delta}\n` +
                    `• New Stock Level: ${res.newStock} ${item.unit}\n` +
                    `• Reason: ${reason}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to update stock: ${err.message}` }],
        };
      }
    }
  );

  // 5. Low Stock Alerts
  server.tool(
    'get_low_stock_alerts',
    'Retrieve all inventory items running low on stock that require reordering.',
    {},
    async () => {
      try {
        const items = db.getInventory({ lowStockOnly: true });
        if (items.length === 0) {
          return {
            content: [{ type: 'text', text: '🟢 All inventory levels are healthy. No items below replenishment threshold.' }],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `⚠️ Found ${items.length} low-stock item(s) requiring attention:\n\n` +
                items
                  .map(
                    (i) =>
                      `• ${i.name} (SKU: ${i.sku}): Current stock is ${i.stock} ${i.unit} (Alert threshold: ${i.low_stock_alert} ${i.unit})`
                  )
                  .join('\n'),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch low-stock items: ${err.message}` }],
        };
      }
    }
  );
}
