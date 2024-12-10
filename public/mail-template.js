const MailTemplate = (username, phone, address, products) => {
  const money = text => {
    return text.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code',
    });
  };

  const row = products.map(product => {
    return `<tr>
    <td>${product.productId.name}</td>
    <td><img src="${product.productId.img[0]}" alt="${
      product.productId.name
    }" /></td>
    <td>${money(product.productId.price)}</td>
    <td>${product.count}</td>
    <td>${money(product.productId.price * product.count)}</td>
  </tr>`;
  });

  const total = products.reduce(
    (acc, product) => acc + product.productId.price * product.count,
    0
  );

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Bill Check Out</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          color: #666;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th,
        td {
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        img {
          max-width: 100px;
          height: auto;
        }
        .total {
          font-size: 20px;
          font-weight: bold;
          margin-top: 20px;
        }
        .thanks {
          color: #007bff;
          font-size: 18px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Xin Chào ${username},</h1>
        <p>Phone: ${phone}</p>
        <p>Address: ${address}</p>
        <table border="1">
          <thead>
            <tr>
              <th>Tên Sản Phẩm</th>
              <th>Hình Ảnh</th>
              <th>Giá</th>
              <th>Số Lượng</th>
              <th>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
           ${row}
          </tbody>
        </table>
        <div class="total"><h1>Tổng thanh toán: ${money(total)}</h1></div>
        <div class="thanks"><h1>Cám ơn bạn!</h1></div>
      </div>
    </body>
  </html>
  `;
};

module.exports = MailTemplate;
