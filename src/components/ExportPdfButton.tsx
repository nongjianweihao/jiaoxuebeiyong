import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState } from 'react';

interface ExportPdfButtonProps {
  targetId: string;
  filename: string;
}

export function ExportPdfButton({ targetId, filename }: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      const marginX = (pageWidth - width) / 2;
      const marginY = (pageHeight - height) / 2;
      pdf.addImage(imageData, 'PNG', marginX, marginY, width, height);
      pdf.save(filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? '生成中...' : '导出报告'}
    </button>
  );
}
