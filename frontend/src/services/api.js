import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login APIs
export const loginAPI = {
  adminLogin: (adminAccount, adminPassword) =>
    api.post('/login/admin', { adminAccount, adminPassword }),
  memberLogin: (memberAccount, memberPassword) =>
    api.post('/login/user', { memberAccount, memberPassword }),
};

// Member APIs
export const memberAPI = {
  getAll: () => api.get('/member/all'),
  getByAccount: (account) => api.get(`/member/${account}`),
  add: (member) => api.post('/member/add', member),
  update: (member) => api.put('/member/update', member),
  delete: (account) => api.delete(`/member/${account}`),
};

// Employee APIs
export const employeeAPI = {
  getAll: () => api.get('/employee/all'),
  getByAccount: (account) => api.get(`/employee/${account}`),
  add: (employee) => api.post('/employee/add', employee),
  update: (employee) => api.put('/employee/update', employee),
  delete: (account) => api.delete(`/employee/${account}`),
};

// Equipment APIs
export const equipmentAPI = {
  getAll: () => api.get('/equipment/all'),
  getById: (id) => api.get(`/equipment/${id}`),
  add: (equipment) => api.post('/equipment/add', equipment),
  update: (equipment) => api.put('/equipment/update', equipment),
  delete: (id) => api.delete(`/equipment/${id}`),
};

// Class APIs
export const classAPI = {
  getAll: () => api.get('/class/all'),
  getById: (id) => api.get(`/class/${id}`),
  add: (classItem) => api.post('/class/add', classItem),
  update: (classItem) => api.put('/class/update', classItem),
  delete: (id) => api.delete(`/class/${id}`),
  getOrders: (classId) => api.get(`/class/${classId}/orders`),
};

// User APIs
export const userAPI = {
  getInfo: (account) => api.get(`/user/info/${account}`),
  updateInfo: (member) => api.put('/user/info/update', member),
  getClasses: (account) => api.get(`/user/classes/${account}`),
  applyClass: (classId, memberAccount) =>
    api.post('/user/apply', { classId, memberAccount }),
  cancelClass: (orderId) => api.delete(`/user/classes/${orderId}`),
};

// Equipment Booking APIs
export const equipmentBookingAPI = {
  getEquipmentList: () => api.get('/equipment-booking/equipment/list'),
  getEquipmentBookings: (equipmentId) => api.get(`/equipment-booking/equipment/${equipmentId}/bookings`),
  getMemberBookings: (memberAccount) => api.get(`/equipment-booking/member/${memberAccount}/bookings`),
  getBookingDetail: (bookingId) => api.get(`/equipment-booking/booking/${bookingId}`),
  saveTrainingRecords: (bookingId, records, fullyComplete = true, memberAccount) =>
    api.post(`/equipment-booking/booking/${bookingId}/training-records`, {
      records,
      fullyComplete,
      memberAccount
    }),
  updateRecordCompleted: (recordId, completed, memberAccount) =>
    api.patch(`/equipment-booking/training-records/record/${recordId}/completed`, {
      completed,
      memberAccount
    }),
  completeSession: (bookingId, sessionId) =>
    api.post(`/equipment-booking/booking/${bookingId}/session/${sessionId}/complete`),
  deleteTrainingSession: (bookingId, sessionId, memberAccount) =>
    api.delete(
      `/equipment-booking/booking/${bookingId}/session/${sessionId}?memberAccount=${memberAccount}`
    ),
  createBooking: (booking) => api.post('/equipment-booking/booking/create', booking),
  cancelBooking: (bookingId, memberAccount) => 
    api.delete(`/equipment-booking/booking/${bookingId}/member/${memberAccount}`),
  createShareRequest: (bookingId, requesterAccount) => 
    api.post('/equipment-booking/share-request/create', { bookingId, requesterAccount }),
  getReceivedShareRequests: (memberAccount) => 
    api.get(`/equipment-booking/member/${memberAccount}/share-requests/received`),
  getSentShareRequests: (memberAccount) => 
    api.get(`/equipment-booking/member/${memberAccount}/share-requests/sent`),
  handleShareRequest: (requestId, bookingOwnerAccount, action) => 
    api.post(`/equipment-booking/share-request/${requestId}/handle`, { bookingOwnerAccount, action }),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notification/all'),
  getById: (id) => api.get(`/notification/${id}`),
  create: (notification) => api.post('/notification/create', notification),
  delete: (id) => api.delete(`/notification/${id}`),
  batchUpdate: (params) => api.post('/notification/batch-update-members', params),
  getByMemberAccount: (account) => api.get(`/notification/member/${account}`),
};

export default api;
