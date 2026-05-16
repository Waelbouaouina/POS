import FormData from 'form-data';
import fetch from 'node-fetch';

/**
 * Sends HTML content to Gotenberg microservice to generate a PDF.
 * @param htmlContent The fully rendered HTML string
 * @param format Either 'A4' or 'Thermal' (80mm)
 * @returns Buffer containing the generated PDF
 */
export async function generateGotenbergPDF(htmlContent: string, format: 'A4' | 'Thermal'): Promise<Buffer> {
  // Use the docker-compose service name 'gotenberg-pdf' or localhost if running locally
  const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://localhost:3002';
  
  const form = new FormData();
  
  // Gotenberg expects 'index.html' as the entrypoint file
  form.append('files', Buffer.from(htmlContent), 'index.html');
  
  // Add dimensions and margins
  if (format === 'A4') {
    form.append('paperWidth', '8.27'); // A4 width in inches
    form.append('paperHeight', '11.69'); // A4 height in inches
    form.append('marginTop', '0');
    form.append('marginBottom', '0');
    form.append('marginLeft', '0');
    form.append('marginRight', '0');
  } else if (format === 'Thermal') {
    // 80mm width ticket
    form.append('paperWidth', '3.14961'); // 80mm in inches
    // Height can be left default or specified for long receipts
    form.append('paperHeight', '11.69'); 
    form.append('marginTop', '0');
    form.append('marginBottom', '0');
    form.append('marginLeft', '0');
    form.append('marginRight', '0');
  }

  // Submit to Chromium HTML conversion route
  const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gotenberg PDF Generation Failed: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
