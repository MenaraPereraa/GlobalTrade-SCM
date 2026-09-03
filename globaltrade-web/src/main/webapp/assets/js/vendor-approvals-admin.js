// // Vendor Approvals Admin Management
// const CONTEXT_PATH = '${pageContext.request.contextPath}';
// let vendorApplications = [];
// let selectedVendorId = null;
//
// // Initialize on page load
// document.addEventListener('DOMContentLoaded', function () {
//     requireRole(['ADMIN', 'SUPER_ADMIN']);
//     loadVendorApplications();
//
//     // Setup search and filter listeners
//     document.getElementById('searchVendor').addEventListener('input', filterApplications);
//     document.getElementById('statusFilter').addEventListener('change', filterApplications);
// });
//
// // Load vendor applications from backend
// async function loadVendorApplications() {
//     try {
//         const response = await fetchWithAuth('/globaltrade/api/admin/vendor-approvals');
//
//         if (!response.ok) {
//             throw new Error('Failed to load vendor applications');
//         }
//
//         vendorApplications = await response.json();
//         renderVendorApplications();
//         renderVendorTable();
//     } catch (error) {
//         console.error('Error loading vendor applications:', error);
//         showError('Failed to load vendor applications');
//     }
// }
//
// // Render vendor application cards
// function renderVendorApplications() {
//     const container = document.getElementById('vendorApprovalsContainer');
//     const filtered = getFilteredApplications();
//
//     if (filtered.length === 0) {
//         container.innerHTML = '<div class="col-span-full py-10 text-center text-slate-500">No vendor applications found</div>';
//         return;
//     }
//
//     container.innerHTML = filtered.map(vendor => `
//         <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 hover:shadow-lg transition">
//             <div class="flex items-start justify-between mb-4">
//                 <div>
//                     <h3 class="text-lg font-bold text-white">${escapeHtml(vendor.companyName)}</h3>
//                     <p class="text-sm text-slate-400">${escapeHtml(vendor.email)}</p>
//                 </div>
//                 <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(vendor.status)}">
//                     ${vendor.status}
//                 </span>
//             </div>
//             <div class="space-y-2 text-sm mb-4 text-slate-400">
//                 <div><span class="font-medium">Country:</span> ${escapeHtml(vendor.country)}</div>
//                 <div><span class="font-medium">Applied:</span> ${formatDate(vendor.createdAt)}</div>
//                 <div><span class="font-medium">Phone:</span> ${escapeHtml(vendor.phone)}</div>
//             </div>
//             <button onclick="viewVendorDetails(${vendor.id})" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition">
//                 Review Application
//             </button>
//         </div>
//     `).join('');
// }
//
// // Render vendor applications table
// function renderVendorTable() {
//     const tableBody = document.getElementById('vendorTableBody');
//     const filtered = getFilteredApplications();
//
//     if (filtered.length === 0) {
//         tableBody.innerHTML = '<tr><td colspan="6" class="py-10 px-6 text-center text-slate-500">No vendor applications found</td></tr>';
//         return;
//     }
//
//     tableBody.innerHTML = filtered.map(vendor => `
//         <tr class="hover:bg-slate-800/30 transition">
//             <td class="py-4 px-6 font-medium">${escapeHtml(vendor.companyName)}</td>
//             <td class="py-4 px-6 text-slate-400">${escapeHtml(vendor.email)}</td>
//             <td class="py-4 px-6">${escapeHtml(vendor.country)}</td>
//             <td class="py-4 px-6 text-slate-400">${formatDate(vendor.createdAt)}</td>
//             <td class="py-4 px-6">
//                 <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(vendor.status)}">
//                     ${vendor.status}
//                 </span>
//             </td>
//             <td class="py-4 px-6 text-right">
//                 <button onclick="viewVendorDetails(${vendor.id})" class="text-indigo-400 hover:text-indigo-300 transition">
//                     <i class="fa-solid fa-eye mr-2"></i>View
//                 </button>
//             </td>
//         </tr>
//     `).join('');
// }
//
// // View vendor details
// async function viewVendorDetails(vendorId) {
//     const vendor = vendorApplications.find(v => v.id === vendorId);
//     if (!vendor) return;
//
//     selectedVendorId = vendorId;
//     document.getElementById('detailVendorName').textContent = escapeHtml(vendor.companyName);
//
//     const detailsContent = document.getElementById('vendorDetailsContent');
//     detailsContent.innerHTML = `
//         <div class="space-y-3">
//             <div>
//                 <span class="text-slate-400">Company Name:</span>
//                 <p class="font-semibold text-white">${escapeHtml(vendor.companyName)}</p>
//             </div>
//             <div>
//                 <span class="text-slate-400">Email:</span>
//                 <p class="font-semibold text-white">${escapeHtml(vendor.email)}</p>
//             </div>
//             <div>
//                 <span class="text-slate-400">Phone:</span>
//                 <p class="font-semibold text-white">${escapeHtml(vendor.phone)}</p>
//             </div>
//             <div>
//                 <span class="text-slate-400">Country:</span>
//                 <p class="font-semibold text-white">${escapeHtml(vendor.country)}</p>
//             </div>
//             <div>
//                 <span class="text-slate-400">Registration Date:</span>
//                 <p class="font-semibold text-white">${formatDate(vendor.createdAt)}</p>
//             </div>
//             <div>
//                 <span class="text-slate-400">Status:</span>
//                 <p class="font-semibold"><span class="px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(vendor.status)}">${vendor.status}</span></p>
//             </div>
//             ${vendor.description ? `
//             <div>
//                 <span class="text-slate-400">Business Description:</span>
//                 <p class="font-semibold text-white">${escapeHtml(vendor.description)}</p>
//             </div>
//             ` : ''}
//         </div>
//     `;
//
//     document.getElementById('vendorDetailModal').classList.remove('hidden');
// }
//
// // Approve vendor
// async function approveVendor() {
//     if (!selectedVendorId) return;
//
//     try {
//         const response = await fetchWithAuth(`/globaltrade/api/admin/vendor-approvals/${selectedVendorId}/approve`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' }
//         });
//
//         if (!response.ok) {
//             throw new Error('Failed to approve vendor');
//         }
//
//         closeVendorDetailModal();
//         loadVendorApplications();
//         showSuccess('Vendor approved successfully');
//     } catch (error) {
//         console.error('Error approving vendor:', error);
//         showError('Failed to approve vendor');
//     }
// }
//
// // Reject vendor
// async function rejectVendor() {
//     if (!selectedVendorId) return;
//
//     const reason = prompt('Enter rejection reason:');
//     if (!reason) return;
//
//     try {
//         const response = await fetchWithAuth(`/globaltrade/api/admin/vendor-approvals/${selectedVendorId}/reject`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ reason })
//         });
//
//         if (!response.ok) {
//             throw new Error('Failed to reject vendor');
//         }
//
//         closeVendorDetailModal();
//         loadVendorApplications();
//         showSuccess('Vendor rejected');
//     } catch (error) {
//         console.error('Error rejecting vendor:', error);
//         showError('Failed to reject vendor');
//     }
// }
//
// // Close modal
// function closeVendorDetailModal() {
//     document.getElementById('vendorDetailModal').classList.add('hidden');
//     selectedVendorId = null;
// }
//
// // Filter applications
// function filterApplications() {
//     renderVendorApplications();
//     renderVendorTable();
// }
//
// // Get filtered applications
// function getFilteredApplications() {
//     const searchTerm = document.getElementById('searchVendor').value.toLowerCase();
//     const statusFilter = document.getElementById('statusFilter').value;
//
//     return vendorApplications.filter(vendor => {
//         const matchesSearch =
//             vendor.companyName.toLowerCase().includes(searchTerm) ||
//             vendor.email.toLowerCase().includes(searchTerm);
//         const matchesStatus = !statusFilter || vendor.status === statusFilter;
//         return matchesSearch && matchesStatus;
//     });
// }
//
// // Utility functions
// function getStatusBadgeClass(status) {
//     switch (status) {
//         case 'PENDING':
//             return 'bg-amber-500/20 text-amber-400';
//         case 'APPROVED':
//             return 'bg-emerald-500/20 text-emerald-400';
//         case 'REJECTED':
//             return 'bg-rose-500/20 text-rose-400';
//         default:
//             return 'bg-slate-700/50 text-slate-300';
//     }
// }
//
// function formatDate(dateString) {
//     return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//     });
// }
//
// function escapeHtml(text) {
//     const div = document.createElement('div');
//     div.textContent = text;
//     return div.innerHTML;
// }
//
// function showError(message) {
//     alert(`Error: ${message}`);
// }
//
// function showSuccess(message) {
//     alert(`Success: ${message}`);
// }
//
// // Logout function
// function logoutAdmin() {
//     logout();
// }
