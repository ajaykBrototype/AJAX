
/**
 * Invoice Generation Utility
 * Uses html2pdf.js for client-side PDF generation
 */

function downloadInvoice(orderId) {
    const element = document.getElementById('invoice-template');
    
    // Check if element exists
    if (!element) {
        console.error('Invoice template not found');
        return;
    }

    // Show loading state on button
    const btn = document.getElementById('download-invoice-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        Generating...
    `;

    // Configuration for html2pdf
    const opt = {
        margin: [0, 0],
        filename: `Invoice_#${orderId.slice(-8).toUpperCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    }).catch(err => {
        console.error('Invoice generation failed:', err);
        btn.disabled = false;
        btn.innerHTML = originalText;
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Could not generate the invoice. Please try again.'
        });
    });
}
