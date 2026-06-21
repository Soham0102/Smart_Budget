const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export const formatCurrency = (amount, currency = 'INR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const CHART_COLORS = ['#4F46E5', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

export const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportExcel = async (rows, filename) => {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
};

export const exportPDF = async (title, sections, filename) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  let y = 36;

  sections.forEach(({ heading, data, columns }) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text(heading, 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [columns],
      body: data.map((row) => columns.map((c) => row[c] ?? '')),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });
    y = doc.lastAutoTable.finalY + 12;
  });

  doc.save(filename);
};
