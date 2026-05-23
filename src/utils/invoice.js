export const printInvoice = (order, userDetails) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert("Please allow popups to print invoices");
    return;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };
  
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
  const itemsRows = items.map((item, index) => {
    const qtyNum = getQtyNumber(item);
    const qtyDisplay = getQtyDisplay(item);
    const priceNum = parseFloat(item.price) || 0;
    const itemTotal = priceNum * qtyNum;
    const farmName = item.farmerName || item.farmer || order.farmer || 'Uzhavar Verified Farm';
    return `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align: left; font-weight: bold; padding-left: 20px;">
          ${item.name}
          <div style="font-size: 11px; color: #666; font-weight: normal; margin-top: 4px;">Producer: ${farmName}</div>
        </td>
        <td>₹${priceNum.toFixed(2)} x ${qtyDisplay}</td>
        <td style="font-weight: bold;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Use exact amounts stored on the order object to guarantee 100% consistency with Checkout/Dashboard
  const subtotal = order.subtotal !== undefined ? order.subtotal : items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * getQtyNumber(item), 0);
  const discountAmount = order.discount !== undefined ? order.discount : 0;
  const deliveryCharge = order.deliveryFee !== undefined ? order.deliveryFee : 0;
  const platformFee = 10.00;
  const gstAmount = parseFloat((subtotal * 0.05).toFixed(2));
  const grandTotal = order.total !== undefined ? order.total : (subtotal - discountAmount + deliveryCharge + platformFee + gstAmount);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${order.id} - Uzhavar Sandhai</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }
        body {
          background: #e8e8e8;
          padding: 40px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .invoice-container {
          max-width: 1000px;
          margin: auto;
          background: #f8f8f8;
          padding: 50px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 15px rgba(0,0,0,.1);
        }
        .top-wave,
        .bottom-wave {
          position: absolute;
          left: -10%;
          width: 120%;
          height: 130px;
          background: linear-gradient(135deg, #8ee88e, #d3ffd3);
          border-radius: 50%;
        }
        .top-wave {
          top: -80px;
        }
        .bottom-wave {
          bottom: -80px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 50px;
          position: relative;
          z-index: 10;
        }
        .invoice-info {
          margin-top: 40px;
        }
        .invoice-info p {
          margin-bottom: 8px;
          font-size: 15px;
        }
        .header h1 {
          font-size: 65px;
          font-weight: bold;
          color: #00c853;
        }
        .details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          position: relative;
          z-index: 10;
        }
        .details h3 {
          margin-bottom: 15px;
          font-size: 18px;
          color: #00c853;
        }
        .details p {
          margin-bottom: 8px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          position: relative;
          z-index: 10;
        }
        thead {
          background: #00c853;
          color: white;
        }
        th {
          padding: 15px;
          letter-spacing: 3px;
          font-size: 14px;
          text-transform: uppercase;
        }
        td {
          padding: 15px;
          border-bottom: 1px solid #ddd;
          text-align: center;
          font-size: 14px;
        }
        .summary {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 20px;
          position: relative;
          z-index: 10;
        }
        .totals-box {
          width: 350px;
          padding: 20px;
          border: 1px solid #ccc;
          background: white;
        }
        .totals-box p {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 14px;
        }
        .grand-total {
          width: 350px;
          padding: 20px;
          background: #00c853;
          color: white;
          font-size: 28px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
        }
        .terms {
          margin-top: 50px;
          position: relative;
          z-index: 10;
        }
        .terms h3 {
          margin-bottom: 15px;
          color: #00c853;
        }
        .terms p {
          font-size: 13px;
          line-height: 1.5;
          color: #555;
        }
        @media print {
          body {
            background: #fff;
            padding: 0;
          }
          .invoice-container {
            box-shadow: none;
            padding: 20px 0;
            width: 100%;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="top-wave"></div>
        <div class="header">
          <div class="invoice-info">
            <p><strong>Invoice Number:</strong> <span>${order.id}</span></p>
            <p><strong>Date:</strong> <span>${formatDate(order.createdAt || order.created_at)}</span></p>
          </div>
          <h1>INVOICE</h1>
        </div>

        <div class="details">
          <div>
            <h3>BILL TO:</h3>
            <p><b>${userDetails?.fullName || userDetails?.name || order.customerName || 'Valued Customer'}</b></p>
            <p>${userDetails?.address || order.shippingAddress || order.address || 'Uzhavar Delivery Zone'}</p>
            <p>${userDetails?.city || order.city || 'Tamil Nadu'}</p>
          </div>
          <div>
            <h3>PAYMENT INFORMATION:</h3>
            <p><strong>Bank (Method):</strong> <span>${order.deliveryDetails?.paymentMethod || order.paymentMethod || 'Cash on Delivery'}</span></p>
            <p><strong>Name:</strong> <span>${userDetails?.fullName || userDetails?.name || order.customerName || 'Valued Customer'}</span></p>
            <p><strong>Account (Status):</strong> <span>${order.paymentStatus === 'Paid' ? 'Paid Online' : 'Cash Collection'}</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ITEM</th>
              <th>DESCRIPTION</th>
              <th>RATE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="totals-box">
            <p>
              <span>Sub Total:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </p>
            ${discountAmount > 0 ? `
              <p style="color: #00c853; font-weight: bold;">
                <span>Bulk Discount:</span>
                <span>- ₹${discountAmount.toFixed(2)}</span>
              </p>
            ` : ''}
            <p>
              <span>Delivery Charge:</span>
              <span>₹${deliveryCharge.toFixed(2)}</span>
            </p>
            <p>
              <span>Platform Fee:</span>
              <span>₹${platformFee.toFixed(2)}</span>
            </p>
            <p>
              <span>GST (5%):</span>
              <span>₹${gstAmount.toFixed(2)}</span>
            </p>
          </div>
          <div class="grand-total">
            <span>TOTAL:</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="terms">
          <h3>TERM AND CONDITIONS:</h3>
          <p>Thank you for buying direct and supporting our local farm community! 🌱 This is a computer generated invoice and requires no signature. Payment is subject to standard terms of purchase.</p>
        </div>
        <div class="bottom-wave"></div>
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
