// @ts-ignore
import html2pdf from 'html2pdf.js';

export const exportToPDF = async (containerId: string, title: string) => {
  const element = document.getElementById(containerId);
  if (!element) {
    alert('لم يتم العثور على التقرير');
    return;
  }

  // Create a temporary container to format the PDF content
  const printContainer = document.createElement('div');
  printContainer.style.padding = '20px';
  printContainer.style.direction = 'rtl';
  printContainer.style.fontFamily = 'Arial, sans-serif';
  printContainer.style.backgroundColor = 'white';
  
  // Add Logo
  const logoContainer = document.createElement('div');
  logoContainer.style.textAlign = 'center';
  logoContainer.style.marginBottom = '20px';
  
  const img = new Image();
  img.src = '/logo.svg';
  img.style.width = '100px';
  img.style.height = 'auto';
  img.style.margin = '0 auto';
  
  // We don't strictly wait for the image to load, html2pdf will try to capture it
  // But to be safe, we can wait a bit
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve; // Continue even if logo fails
    // Timeout just in case
    setTimeout(resolve, 500);
  });
  
  logoContainer.appendChild(img);
  printContainer.appendChild(logoContainer);
  
  // Add Title
  const titleEl = document.createElement('h2');
  titleEl.innerText = title;
  titleEl.style.textAlign = 'center';
  titleEl.style.marginBottom = '30px';
  printContainer.appendChild(titleEl);
  
  // Clone the table/content
  const clonedContent = element.cloneNode(true) as HTMLElement;
  
  // Remove elements that shouldn't be printed (like buttons with print:hidden)
  const hiddenElements = clonedContent.querySelectorAll('.print\\:hidden');
  hiddenElements.forEach(el => el.remove());
  
  printContainer.appendChild(clonedContent);
  
  // Temporarily append to body to render
  document.body.appendChild(printContainer);

  const opt = {
    margin:       10,
    filename:     `${title}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm' as const, format: 'a4', orientation: 'landscape' as const }
  };

  try {
    // Handle different export formats of html2pdf
    const pdfGenerator = typeof html2pdf === 'function' ? html2pdf() : (html2pdf as any).default();
    await pdfGenerator.set(opt).from(printContainer).save();
  } catch (error) {
    console.error('PDF Export Error:', error);
    alert('حدث خطأ أثناء تصدير ملف PDF. يرجى المحاولة مرة أخرى.');
  } finally {
    // Clean up
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
  }
};

export const exportToDOCX = (tableId: string, title: string) => {
  const table = document.getElementById(tableId);
  if (!table) {
    alert('لم يتم العثور على التقرير');
    return;
  }

  const clonedTable = table.cloneNode(true) as HTMLElement;
  const hiddenElements = clonedTable.querySelectorAll('.print\\:hidden, .hidden');
  hiddenElements.forEach(el => el.remove());

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 8px; text-align: center; }
        th { background-color: #f3f4f6; }
      </style>
    </head>
    <body dir="rtl">
      <h1 style="text-align: center;">${title}</h1>
      ${clonedTable.outerHTML}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });
  
  const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
