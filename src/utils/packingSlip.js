export const printPackingSlip = (order, farmerId) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert("Please allow popups to print packing slips");
    return;
  }
  
  const getQtyNumber = (item) => {
    const raw = item.quantity !== undefined ? item.quantity : item.qty;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      const parsed = parseFloat(raw);
      return isNaN(parsed) ? 1 : parsed;
    }
    return 1;
  };

  const getQtyDisplay = (item) => {
    const raw = item.qty !== undefined ? item.qty : item.quantity;
    if (!raw) return '1 KG';
    const str = String(raw).trim();
    const lower = str.toLowerCase();
    if (lower.includes('kg') || lower.includes('g') || lower.includes('unit') || lower.includes('packet')) {
      return str.toUpperCase();
    }
    return `${str} KG`;
  };

  const items = Array.isArray(order.items) ? order.items : (order.itemsList || []);
  
  // Filter items specifically for this farmer if farmerId is provided
  const farmerItems = farmerId 
    ? items.filter(item => String(item.farmerId) === String(farmerId))
    : items;

  const itemsRows = farmerItems.map(item => {
    const qtyNum = getQtyNumber(item);
    const qtyDisplay = getQtyDisplay(item);
    const priceNum = parseFloat(item.price) || 0;
    const itemTotal = priceNum * qtyNum;
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-size: 18px; color: #bbb;">☐</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left; font-weight: 600;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${qtyDisplay}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${priceNum.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const totalItemsCount = farmerItems.length;
  const farmerProduceTotal = farmerItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * getQtyNumber(item), 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Packing Slip #${order.id} - Uzhavar Sandhai</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        body {
          font-family: 'Outfit', sans-serif;
          color: #222;
          margin: 40px;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #059669;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 26px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: -0.5px;
        }
        .logo span {
          color: #059669;
        }
        .subtitle {
          font-size: 11px;
          color: #4b5563;
          margin-top: 4px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .slip-title {
          text-align: right;
        }
        .slip-title h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: 0.5px;
        }
        .slip-title p {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 30px;
          margin-bottom: 35px;
        }
        .info-block {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          border-radius: 12px;
          padding: 20px;
        }
        .info-block.secondary {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
        }
        .info-block h3 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #047857;
          margin: 0 0 12px 0;
          border-bottom: 1.5px solid #bbf7d0;
          padding-bottom: 6px;
        }
        .info-block.secondary h3 {
          color: #475569;
          border-bottom-color: #e2e8f0;
        }
        .info-block p {
          margin: 6px 0;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 500;
        }
        .info-block p b {
          color: #0f172a;
        }
        .table-title {
          font-size: 15px;
          font-weight: 800;
          color: #064e3b;
          margin: 20px 0 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .table-title span {
          background: #dcfce7;
          color: #15803d;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-weight: 700;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .invoice-table th {
          background: #f0fdf4;
          color: #064e3b;
          text-align: left;
          padding: 12px;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #bbf7d0;
        }
        .summary-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 15px;
          margin-bottom: 30px;
        }
        .summary-table {
          width: 320px;
          border-collapse: collapse;
        }
        .summary-table td {
          padding: 8px 12px;
          font-size: 14px;
        }
        .summary-table tr.total-row {
          border-top: 2.5px solid #059669;
          font-weight: bold;
          font-size: 16px;
          color: #064e3b;
        }
        .summary-table tr.total-row td {
          padding-top: 12px;
        }
        .instructions-block {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          padding: 15px 20px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .instructions-block h4 {
          margin: 0 0 6px 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #b45309;
          font-weight: 800;
        }
        .instructions-block p {
          margin: 0;
          font-size: 13px;
          color: #78350f;
          font-weight: 500;
          line-height: 1.4;
        }
        .tags-container {
          display: flex;
          gap: 6px;
          margin-top: 6px;
        }
        .tag {
          font-size: 10px;
          background: #f3f4f6;
          color: #4b5563;
          border: 1.5px solid #e5e7eb;
          padding: 2px 8px;
          border-radius: 9999px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
          border-top: 1.5px dashed #e2e8f0;
          padding-top: 20px;
          font-size: 13px;
          color: #4b5563;
          font-weight: 500;
        }
        .stamp {
          display: inline-block;
          border: 2px solid #059669;
          color: #059669;
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          padding: 3px 10px;
          margin-top: 8px;
          border-radius: 5px;
          transform: rotate(-2deg);
        }
        @media print {
          body {
            margin: 20px;
          }
          .info-block {
            border: 1px solid #dcfce7 !important;
          }
          .info-block.secondary {
            border: 1px solid #f1f5f9 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div>
          <div class="logo">UZHAVAR <span>SANTHAI</span></div>
          <div class="subtitle">Direct Farmer-to-Consumer Packing Slip</div>
        </div>
        <div class="slip-title">
          <h2>CUSTOMER DISPATCH SLIP</h2>
          <p>Order ID: <b>${order.id}</b></p>
          <p>Date: ${order.date}</p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-block">
          <h3>Customer Details</h3>
          <p>Name: <b>${order.customer || order.customerName || 'Valued Customer'}</b></p>
          <p>Delivery Address: <b>${order.address || 'Uzhavar Delivery Zone'}</b></p>
          <p>Phone: <b>${order.phone || 'Customer Phone'}</b></p>
          <p>Email: <b>customer@uzhavar.com</b></p>
        </div>
        
        <div class="info-block secondary">
          <h3>Fulfillment Details</h3>
          <p>Status: <span style="color: #059669; font-weight: bold;">${order.status.toUpperCase()}</span></p>
          <p>Payment Mode: <b>${order.deliveryDetails?.paymentMethod || order.paymentMethod || 'Cash on Delivery'}</b></p>
          <p>Delivery Slot: <b>${order.deliveryDetails?.scheduledSlot || 'Express (Optimized)'}</b></p>
          <div class="stamp" style="border-color: ${order.paymentStatus === 'Paid' ? '#059669' : '#d97706'}; color: ${order.paymentStatus === 'Paid' ? '#059669' : '#d97706'};">
            ${order.paymentStatus === 'Paid' ? 'PAID ONLINE' : 'COD - CASH COLLECTION'}
          </div>
        </div>
      </div>

      ${order.deliveryDetails?.instructions || (order.deliveryDetails?.tags && order.deliveryDetails.tags.length > 0) ? `
        <div class="instructions-block">
          <h4>Delivery Note / Directives</h4>
          <p>${order.deliveryDetails?.instructions || 'No custom delivery message left by customer.'}</p>
          ${order.deliveryDetails?.tags && order.deliveryDetails.tags.length > 0 ? `
            <div class="tags-container">
              ${order.deliveryDetails.tags.map(t => `<span class="tag">📌 ${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="table-title">
        Produce Packing Checklist <span>${totalItemsCount} items to pack</span>
      </div>
      
      <table class="invoice-table">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">Pack</th>
            <th style="width: 47%; text-align: left;">Produce Item</th>
            <th style="width: 15%; text-align: center;">Qty / Weight</th>
            <th style="width: 15%; text-align: right;">Unit Price</th>
            <th style="width: 15%; text-align: right;">Total Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="summary-container">
        <table class="summary-table">
          <tr class="total-row">
            <td>Your Produce Sales Total</td>
            <td style="text-align: right;">₹${farmerProduceTotal.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>Packed with care and shipped fresh from your farm! 🌱</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 10px;">Please check all items off before handoff to the delivery rider.</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
