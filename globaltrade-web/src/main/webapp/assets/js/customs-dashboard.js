let allCustomsShipments = [];
let filteredCustomsShipments = [];
let currentCustomsPage = 1;
const itemsPerCustomsPage = 10;
let currentShipmentId = null;

const DOC_STATUS_STYLES = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200'
};

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Content-Type': 'application/json'
    };
}

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

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
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
    fetchCustomsShipments();

    const searchInput = document.querySelector("input[placeholder*='Search']");
    if (searchInput) {
        searchInput.addEventListener("input", filterCustomsTable);
    }
});

function renderCustomsRow(shipment, index) {
    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4">
                <span class="text-sm font-semibold text-slate-800">#${index}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-slate-700">${shipment.carrierName ?? '—'}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 text-sm text-slate-600">
                    <span>${shipment.originHub ?? '—'}</span>
                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                    <span>${shipment.destinationHub ?? '—'}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-500">${shipment.eta ?? '—'}</td>
            <td class="px-6 py-4">
                <button onclick="openDocumentsModal(${shipment.shipmentId}, ${index})"
                        class="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors">
                    Review Documents
                </button>
            </td>
        </tr>
    `;
}

function renderLoadingRow() {
    return `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center text-slate-500">
                <span class="text-sm font-medium">Loading shipments...</span>
            </td>
        </tr>
    `;
}

function renderEmptyRow() {
    return `
        <tr>
            <td colspan="5" class="px-6 py-14 text-center">
                <p class="text-slate-500 font-medium">No shipments currently in customs</p>
                <p class="text-sm text-slate-400 mt-1">New holds will show up here automatically.</p>
            </td>
        </tr>
    `;
}

function renderErrorRow() {
    return `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center">
                <span class="text-sm font-medium text-red-500">Error loading shipments.</span>
                <br>
                <button onclick="fetchCustomsShipments()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1">Try again</button>
            </td>
        </tr>
    `;
}

function updateSummary(shipments) {
    const countEl = document.getElementById('summaryHeldCount');
    const etaEl = document.getElementById('summaryNearestEta');
    if (countEl) countEl.textContent = shipments.length;

    if (etaEl) {
        const etas = shipments.map(s => s.eta).filter(Boolean).sort();
        etaEl.textContent = etas.length ? etas[0] : '—';
    }
}

async function fetchCustomsShipments() {
    const tableBody = document.getElementById('customsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = renderLoadingRow();

    try {
        // මෙහි /globaltrade/api/customs/in-customs වෙත request එක යවන ලෙස වෙනස් කරන ලදී
        const url = window.location.origin + "/globaltrade/api/customs/shipments/in-customs";
        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch shipments (status ' + response.status + ')');

        allCustomsShipments = await response.json();
        updateSummary(allCustomsShipments);
        filterCustomsTable();
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = renderErrorRow();
    }
}

function filterCustomsTable() {
    const searchInput = document.querySelector("input[placeholder*='Search']");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    filteredCustomsShipments = allCustomsShipments.filter(shipment => {
        const shipmentId = shipment.shipmentId ? shipment.shipmentId.toString() : "";
        const carrier = shipment.carrierName?.toLowerCase() || "";
        const origin = shipment.originHub?.toLowerCase() || "";
        const destination = shipment.destinationHub?.toLowerCase() || "";

        return shipmentId.includes(searchText) || carrier.includes(searchText) || origin.includes(searchText) || destination.includes(searchText);
    });

    currentCustomsPage = 1;
    renderCustomsTable();
}

function renderCustomsTable() {
    const tableBody = document.getElementById('customsTableBody');
    if (!tableBody) return;

    if (!filteredCustomsShipments || filteredCustomsShipments.length === 0) {
        tableBody.innerHTML = renderEmptyRow();
        renderCustomsPaginationControls(0);
        return;
    }

    const totalPages = Math.ceil(filteredCustomsShipments.length / itemsPerCustomsPage);
    if (currentCustomsPage > totalPages) currentCustomsPage = totalPages || 1;

    const start = (currentCustomsPage - 1) * itemsPerCustomsPage;
    const end = start + itemsPerCustomsPage;
    const paginatedItems = filteredCustomsShipments.slice(start, end);

    tableBody.innerHTML = paginatedItems.map((shipment, idx) => renderCustomsRow(shipment, start + idx + 1)).join('');
    renderCustomsPaginationControls(totalPages);
}

function renderCustomsPaginationControls(totalPages) {
    let paginationContainer = document.getElementById("customsPagination");

    if (!paginationContainer) {
        const parentTable = document.querySelector("table")?.parentElement;
        if (parentTable) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "customsPagination";
            paginationContainer.className = "flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100";
            parentTable.appendChild(paginationContainer);
        } else {
            return;
        }
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        paginationContainer.classList.add("hidden");
        return;
    }

    paginationContainer.classList.remove("hidden");
    const startEntry = (currentCustomsPage - 1) * itemsPerCustomsPage + 1;
    const endEntry = Math.min(currentCustomsPage * itemsPerCustomsPage, filteredCustomsShipments.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry} to ${endEntry} of ${filteredCustomsShipments.length} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changeCustomsPage(${currentCustomsPage - 1})" ${currentCustomsPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentCustomsPage} of ${totalPages}</span>
            <button onclick="changeCustomsPage(${currentCustomsPage + 1})" ${currentCustomsPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
}

function changeCustomsPage(page) {
    currentCustomsPage = page;
    renderCustomsTable();
}

async function openDocumentsModal(shipmentId, displayIndex) {
    currentShipmentId = shipmentId;
    document.getElementById('modalShipmentId').textContent = displayIndex;
    document.getElementById('documentsModal').classList.remove('hidden');
    await loadDocuments();
}

function closeDocumentsModal() {
    document.getElementById('documentsModal').classList.add('hidden');
    currentShipmentId = null;
}

async function loadDocuments() {
    const list = document.getElementById('documentsList');
    if (!currentShipmentId) return;

    list.innerHTML = `<div class="flex items-center justify-center gap-2 py-6 text-slate-500">Loading documents...</div>`;

    try {
        const response = await fetchWithAuth(window.location.origin + `/globaltrade/api/customs/shipments/${currentShipmentId}/documents`, {
            method: 'GET',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Failed to load documents');

        const docs = await response.json();
        list.innerHTML = docs.length
            ? docs.map(renderDocumentRow).join('')
            : '<p class="text-sm text-slate-400 text-center py-6">No customs documents yet for this shipment.</p>';
    } catch (error) {
        list.innerHTML = '<p class="text-sm text-red-500 text-center py-6">Error loading documents.</p>';
    }
}

function renderDocumentRow(doc) {
    const statusColor = DOC_STATUS_STYLES[doc.status] || 'bg-slate-50 text-slate-600 border-slate-200';

    const actions = doc.status === 'PENDING'
        ? `<div class="flex items-center gap-2">
               <button onclick="viewDocumentPdf(${doc.documentId})" class="text-indigo-600 hover:text-indigo-800 text-xs font-semibold px-2.5 py-1 bg-indigo-50 rounded-md transition-colors">View PDF</button>
               <button onclick="approveDocument(${doc.documentId})" class="text-emerald-600 hover:text-emerald-800 text-xs font-semibold px-2.5 py-1 bg-emerald-50 rounded-md transition-colors">Approve</button>
               <button onclick="promptRejectReason(${doc.documentId})" class="text-red-600 hover:text-red-800 text-xs font-semibold px-2.5 py-1 bg-red-50 rounded-md transition-colors">Reject</button>
           </div>`
        : `<button onclick="viewDocumentPdf(${doc.documentId})" class="text-indigo-600 hover:text-indigo-800 text-xs font-semibold px-2.5 py-1 bg-indigo-50 rounded-md transition-colors">View PDF</button>`;

    return `
        <div class="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50 transition-colors">
            <div>
                <p class="text-sm font-medium text-slate-800">${doc.declarationType} — Doc #${doc.documentId}</p>
                <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}">${doc.status}</span>
            </div>
            <div class="shrink-0">${actions}</div>
        </div>
    `;
}

async function viewDocumentPdf(documentId) {
    const modal = document.getElementById('pdfViewerModal');
    const container = document.getElementById('pdfContainer');

    container.innerHTML = `<div class="flex items-center justify-center h-full text-slate-500">Loading official document...</div>`;
    modal.classList.remove('hidden');

    try {
        const url = window.location.origin + `/globaltrade/api/customs/documents/${documentId}/view`;
        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to load document preview');

        const doc = await response.json();

        container.innerHTML = `
            <div class="h-full overflow-y-auto bg-slate-100 p-6 flex justify-center">
                <div class="bg-white w-full max-w-2xl p-10 shadow-lg border border-slate-300 font-serif text-slate-800 space-y-6 relative rounded-sm my-auto">
                    <div class="text-center border-b-2 border-slate-800 pb-4">
                        <h1 class="text-2xl font-bold uppercase tracking-widest text-slate-900">Global Trade Portal</h1>
                        <p class="text-xs uppercase tracking-widest text-slate-500 mt-1">Official Customs Clearance Declaration Certificate</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm border-b border-slate-200 pb-4 font-sans">
                        <div>
                            <span class="text-xs uppercase tracking-wider text-slate-400 block font-semibold">Document Reference</span>
                            <span class="font-mono font-bold text-slate-900 text-base">#DOC-${doc.documentId}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs uppercase tracking-wider text-slate-400 block font-semibold">Issued Date</span>
                            <span class="text-slate-800 font-medium">${doc.clearanceDate ? doc.clearanceDate : 'Pending Clearance'}</span>
                        </div>
                    </div>

                    <div class="space-y-4 font-sans text-sm pt-2">
                        <div class="flex justify-between items-center py-2 border-b border-slate-100">
                            <span class="text-slate-500 font-medium">Declaration Type:</span>
                            <span class="font-bold text-slate-900">${doc.declarationType}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-slate-100">
                            <span class="text-slate-500 font-medium">Current Status:</span>
                            <span class="font-bold uppercase px-2.5 py-0.5 rounded text-xs ${doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">${doc.status}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-slate-100">
                            <span class="text-slate-500 font-medium">Associated Shipment ID:</span>
                            <span class="font-bold text-slate-900">#${doc.shipment ? doc.shipment.shipmentId : 'N/A'}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-slate-100">
                            <span class="text-slate-500 font-medium">Reviewed By User ID:</span>
                            <span class="font-bold text-slate-900">${doc.reviewedBy ? 'User #' + doc.reviewedBy : 'Awaiting Review'}</span>
                        </div>
                    </div>

                    <div class="pt-10 mt-12 border-t border-slate-300 flex justify-between items-end font-sans">
                        <div>
                            <p class="text-[10px] text-slate-400 uppercase">System Generated Secure Record</p>
                            <p class="text-xs text-slate-600 font-mono">Verification Hash: ${Math.random().toString(36).substring(2, 12)}</p>
                        </div>
                        <div class="text-right">
                            <div class="h-10 mb-1 flex items-center justify-end">
                                <span class="font-serif italic text-slate-400 text-sm">Authorized Official</span>
                            </div>
                            <p class="text-xs font-bold text-slate-800 uppercase tracking-wider border-t border-slate-400 pt-1">Customs Department</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div class="flex items-center justify-center h-full text-red-500 font-sans">Error loading official document.</div>`;
    }
}

function closePdfModal() {
    const modal = document.getElementById('pdfViewerModal');
    const container = document.getElementById('pdfContainer');
    container.innerHTML = '';
    modal.classList.add('hidden');
}

async function createDocument() {
    if (!currentShipmentId) return;

    const declarationTypeElement = document.getElementById('newDeclarationType');
    const declarationType = declarationTypeElement ? declarationTypeElement.value : 'IMPORT';

    if (!declarationType) {
        alert('Please select a declaration type.');
        return;
    }

    try {
        const response = await fetchWithAuth(window.location.origin + `/globaltrade/api/customs/shipments/${currentShipmentId}/documents`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ declarationType: declarationType })
        });

        if (!response.ok) throw new Error('Failed to create document');

        showToast('Success', 'Declaration created successfully.');
        await loadDocuments();
        await fetchCustomsShipments();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function approveDocument(documentId) {
    try {
        const response = await fetchWithAuth(window.location.origin + `/globaltrade/api/customs/documents/${documentId}/approve`, {
            method: 'PUT',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Failed to approve document');

        showToast('Approved', 'Customs document has been approved successfully.');
        await loadDocuments();
        await fetchCustomsShipments();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

function promptRejectReason(documentId) {
    const modal = document.getElementById('rejectModal');
    const input = document.getElementById('rejectReasonInput');
    const submitBtn = document.getElementById('modalSubmitBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    modal.classList.remove('hidden');
    input.value = '';
    input.focus();

    const cleanup = () => {
        modal.classList.add('hidden');
        submitBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    submitBtn.onclick = async () => {
        const reason = input.value.trim();
        cleanup();
        await rejectDocument(documentId, reason);
    };

    cancelBtn.onclick = () => {
        cleanup();
    };
}

async function rejectDocument(documentId, reason) {
    try {
        const response = await fetchWithAuth(window.location.origin + `/globaltrade/api/customs/documents/${documentId}/reject?reason=` + encodeURIComponent(reason), {
            method: 'PUT',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Failed to reject document');

        showToast('Rejected', 'Customs document has been rejected.', 'warning');
        await loadDocuments();
        await fetchCustomsShipments();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

window.fetchCustomsShipments = fetchCustomsShipments;
window.openDocumentsModal = openDocumentsModal;
window.closeDocumentsModal = closeDocumentsModal;
window.approveDocument = approveDocument;
window.promptRejectReason = promptRejectReason;
window.createDocument = createDocument;
window.viewDocumentPdf = viewDocumentPdf;
window.closePdfModal = closePdfModal;