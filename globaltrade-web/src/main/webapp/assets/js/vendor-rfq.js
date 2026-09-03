document.addEventListener("DOMContentLoaded", () => {
    loadVendorActiveRfqs();
    loadVendorQuotationHistory();
});

// Tab Switching Logic
function switchVendorTab(tabName) {
    const activeSection = document.getElementById('activeRfqsSection');
    const submittedSection = document.getElementById('submittedQuotationsSection');
    const tabActiveBtn = document.getElementById('tabActiveBtn');
    const tabSubmittedBtn = document.getElementById('tabSubmittedBtn');

    if (tabName === 'active') {
        activeSection.classList.remove('hidden');
        activeSection.classList.add('block');
        submittedSection.classList.remove('block');
        submittedSection.classList.add('hidden');

        tabActiveBtn.className = "py-3 px-6 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 transition-colors";
        tabSubmittedBtn.className = "py-3 px-6 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors";
    } else {
        activeSection.classList.remove('block');
        activeSection.classList.add('hidden');
        submittedSection.classList.remove('hidden');
        submittedSection.classList.add('block');

        tabSubmittedBtn.className = "py-3 px-6 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 transition-colors";
        tabActiveBtn.className = "py-3 px-6 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors";

        loadVendorQuotationHistory();
    }
}

// Utility: getCookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;');
}

// Toast Notifications
function showToast(title, message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-start gap-3 w-80 bg-white border border-slate-100 rounded-xl p-4 shadow-xl shadow-slate-200/50 transform translate-y-2 opacity-0 transition-all duration-300 relative overflow-hidden`;

    let borderColor = 'border-b-4 border-emerald-500';
    let iconBg = 'bg-emerald-50 text-emerald-600';
    let iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>`;

    if (type === 'error') {
        borderColor = 'border-b-4 border-red-500';
        iconBg = 'bg-red-50 text-red-600';
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`;
    } else if (type === 'warning') {
        borderColor = 'border-b-4 border-amber-500';
        iconBg = 'bg-amber-50 text-amber-600';
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>`;
    }

    toast.classList.add(...borderColor.split(' '));

    toast.innerHTML = `
        <div class="p-2 rounded-lg ${iconBg} shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${iconSvg}</svg>
        </div>
        <div class="flex-1 min-w-0 pr-2">
            <h4 class="text-sm font-bold text-slate-800">${title}</h4>
            <p class="text-xs text-slate-500 mt-0.5">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Modals: Submit Quotation
function openSubmitModal(rfqId, productName, qty) {
    const modalRfqIdInput = document.getElementById('modalRfqId');
    const modalRfqTitleEl = document.getElementById('modalRfqTitle');
    const submitModalEl = document.getElementById('submitModal');

    if (modalRfqIdInput) modalRfqIdInput.value = rfqId;
    if (modalRfqTitleEl) {
        modalRfqTitleEl.innerText = `Bidding for RFQ: ${rfqId} (${productName} - ${qty} Units)`;
    }

    if (submitModalEl) {
        submitModalEl.classList.remove('hidden');
        submitModalEl.classList.add('flex');
    }
}

function closeSubmitModal() {
    const submitModalEl = document.getElementById('submitModal');
    const formEl = document.getElementById('quotationForm');

    if (submitModalEl) {
        submitModalEl.classList.remove('flex');
        submitModalEl.classList.add('hidden');
    }

    if (formEl) {
        formEl.reset();
    }
}

// Modals: Secure PDF Viewer using FileDownloadResource API Endpoint
async function previewPdfFromEndpoint(pdfPath) {
    if (!pdfPath) {
        showToast('No Document', 'No PDF document available.', 'error');
        return;
    }

    // Fix: Path eke subfolders thibunath anthimata thiyena file name eka witharak clean karaganeema
    const cleanPath = pdfPath.replace(/\\/g, '/');
    const fileName = cleanPath.split('/').pop().trim();

    if (!fileName) {
        showToast('Error', 'Invalid filename.', 'error');
        return;
    }

    const modal = document.getElementById('pdfViewerModal');
    const iframe = document.getElementById('pdfIframe');

    try {
        const encodedFileName = encodeURIComponent(fileName);
        const pdfUrl = `${window.location.origin}/globaltrade/api/uploads/${encodedFileName}`;

        const token = getCookie('accessToken');
        const response = await fetch(pdfUrl, {
            method: "GET",
            headers: Object.assign({
                "Accept": "*/*"
            }, token ? { 'Authorization': 'Bearer ' + token } : {})
        });

        if (!response.ok) {
            throw new Error(`Failed to load document. Status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (iframe && modal) {
            iframe.src = blobUrl;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

    } catch (error) {
        console.error("Error loading PDF blob:", error);
        showToast('Error', 'Could not load PDF securely. File might be missing in server upload directory.', 'error');
    }
}


function closePdfModal() {
    const modal = document.getElementById('pdfViewerModal');
    const iframe = document.getElementById('pdfIframe');

    if (modal && iframe) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        iframe.src = '';
    }
}

// Submit Data
function submitQuotation(event) {
    event.preventDefault();

    const formElement = document.getElementById('quotationForm');
    const formData = new FormData(formElement);

    const apiUrl = window.location.origin + "/globaltrade/api/vendors/responses";
    const token = getCookie('accessToken');

    fetch(apiUrl, {
        method: 'POST',
        credentials: token ? 'omit' : 'include',
        headers: Object.assign({
            'Accept': 'application/json'
        }, token ? { 'Authorization': 'Bearer ' + token } : {}),
        body: formData
    })
        .then(response => {
            if (response.ok) {
                showToast('Success', 'Quotation submitted successfully!', 'success');
                closeSubmitModal();
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                response.text().then(err => {
                    showToast('Failed', 'Failed to submit quotation: ' + err, 'error');
                });
            }
        })
        .catch(error => {
            console.error('Error submitting quotation:', error);
            showToast('Error', 'An error occurred while submitting.', 'error');
        });
}

// Load Active RFQs Table
function loadVendorActiveRfqs() {
    const tableBody = document.getElementById('activeRfqsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400 italic">Loading active RFQs...</td></tr>`;

    const url = window.location.origin + "/globaltrade/api/vendors/active-rfqs";
    const token = getCookie('accessToken');

    fetch(url, {
        method: 'GET',
        credentials: token ? 'omit' : 'include',
        headers: Object.assign({
            'Accept': 'application/json'
        }, token ? { 'Authorization': 'Bearer ' + token } : {})
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            tableBody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500">No active RFQs at the moment.</td></tr>`;
                return;
            }

            data.forEach(rfq => {
                const rfqId = rfq.rfqId || rfq.id || 'N/A';
                const productName = (rfq.product && rfq.product.name) ? rfq.product.name : (rfq.productName || rfq.title || '—');
                const sku = (rfq.product && rfq.product.sku) ? rfq.product.sku : (rfq.sku || '');
                const qty = rfq.requestedQuantity || rfq.quantity || 0;

                const rawDate = rfq.targetDeliveryDate || rfq.target_delivery_date || rfq.closingDate || rfq.deliveryDate;
                const targetDate = rawDate ? new Date(rawDate).toLocaleDateString() : '—';

                const actions = `
                <button onclick="openSubmitModal('${rfqId}', '${escapeHtml(productName)}', ${qty})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition text-xs ml-auto flex items-center gap-1.5">Submit Quote</button>
            `;

                const row = document.createElement('tr');
                row.className = 'hover:bg-slate-50/80 transition';
                row.innerHTML = `
                <td class="p-4 font-bold text-indigo-600">#${rfqId}</td>
                <td class="p-4 font-semibold text-slate-900">${escapeHtml(productName)}${sku ? `<br><span class="text-xs text-slate-500 font-normal">SKU: ${escapeHtml(sku)}</span>` : ''}</td>
                <td class="p-4"><span class="bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-lg border border-amber-200">${qty} Units</span></td>
                <td class="p-4 text-slate-600">${escapeHtml(targetDate)}</td>
                <td class="p-4 text-right">${actions}</td>
            `;
                tableBody.appendChild(row);
            });
        })
        .catch(err => {
            console.error("Error loading active RFQs:", err);
            tableBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-400 italic">Failed to load active RFQs.</td></tr>`;
            showToast('Error', 'Could not load active RFQs.', 'error');
        });
}

// Load Quotation History Table
function loadVendorQuotationHistory() {
    const historyTableBody = document.getElementById('submittedQuotesTable');
    if (!historyTableBody) return;

    historyTableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 italic">Loading your history...</td></tr>`;

    const url = window.location.origin + "/globaltrade/api/vendors/my-quotations";
    const token = getCookie('accessToken');

    fetch(url, {
        method: 'GET',
        credentials: token ? 'omit' : 'include',
        headers: Object.assign({
            'Accept': 'application/json'
        }, token ? { 'Authorization': 'Bearer ' + token } : {})
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            historyTableBody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                historyTableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">No quotations submitted yet.</td></tr>`;
                return;
            }

            data.forEach(q => {
                const rfqId = q.rfqId || q.id || 'N/A';
                const unitPrice = q.unitPrice ? Number(q.unitPrice).toFixed(2) : (q.offeredUnitPrice ? Number(q.offeredUnitPrice).toFixed(2) : '0.00');
                const leadTime = q.leadTimeDays || q.leadTime || q.estimatedLeadTimeDays || '0';
                const remarks = q.remarks || '—';

                const pdfPath = q.pdfPath || q.quotationsPdfPath || q.quotationPdfPath;
                let pdfLink = `<span class="text-slate-400 text-xs italic">No PDF</span>`;

                if (pdfPath) {
                    pdfLink = `<button onclick="previewPdfFromEndpoint('${escapeHtml(pdfPath)}')" class="text-indigo-600 hover:underline font-semibold text-xs flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition hover:bg-indigo-100">📄 View PDF</button>`;
                }

                let statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">Pending</span>`;
                if (q.status === 'ACCEPTED') {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Accepted</span>`;
                } else if (q.status === 'REJECTED') {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">Rejected</span>`;
                }

                const row = document.createElement('tr');
                row.className = 'hover:bg-slate-50/80 transition';
                row.innerHTML = `
                <td class="p-4 font-bold text-slate-800">#${rfqId}</td>
                <td class="p-4 font-bold text-slate-900">$${unitPrice}</td>
                <td class="p-4 text-slate-600">${leadTime} Days</td>
                <td class="p-4 text-slate-500 truncate max-w-xs">${remarks}</td>
                <td class="p-4">${pdfLink}</td>
                <td class="p-4 text-right">${statusBadge}</td>
            `;
                historyTableBody.appendChild(row);
            });
        })
        .catch(err => {
            console.error("Error loading quotation history:", err);
            historyTableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-400 italic">Failed to load quotation history.</td></tr>`;
        });
}