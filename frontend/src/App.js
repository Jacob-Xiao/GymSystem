import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AdminLogin from './pages/AdminLogin';
import AdminMain from './pages/AdminMain';
import UserLogin from './pages/UserLogin';
import UserMain from './pages/UserMain';
import MemberList from './pages/admin/MemberList';
import AddMember from './pages/admin/AddMember';
import UpdateMember from './pages/admin/UpdateMember';
import EmployeeList from './pages/admin/EmployeeList';
import AddEmployee from './pages/admin/AddEmployee';
import UpdateEmployee from './pages/admin/UpdateEmployee';
import EquipmentList from './pages/admin/EquipmentList';
import AddEquipment from './pages/admin/AddEquipment';
import UpdateEquipment from './pages/admin/UpdateEquipment';
import ClassList from './pages/admin/ClassList';
import AddClass from './pages/admin/AddClass';
import UpdateClass from './pages/admin/UpdateClass';
import ClassOrderList from './pages/admin/ClassOrderList';
import UserInfo from './pages/user/UserInfo';
import UpdateUserInfo from './pages/user/UpdateUserInfo';
import UserClass from './pages/user/UserClass';
import ApplyClass from './pages/user/ApplyClass';
import SearchMember from './pages/admin/SearchMember';
import NotificationManagement from './pages/admin/NotificationManagement';
import EquipmentBooking from './pages/user/EquipmentBooking';
import BookingDetail from './pages/user/BookingDetail';
import ShareRequests from './pages/user/ShareRequests';
import EquipmentDetail from './pages/user/EquipmentDetail';
import UserNotifications from './pages/user/UserNotifications';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/main" element={<AdminMain />} />
        <Route path="/admin/members" element={<MemberList />} />
        <Route path="/admin/members/add" element={<AddMember />} />
        <Route path="/admin/members/update/:account" element={<UpdateMember />} />
        <Route path="/admin/members/search" element={<SearchMember />} />
        <Route path="/admin/employees" element={<EmployeeList />} />
        <Route path="/admin/employees/add" element={<AddEmployee />} />
        <Route path="/admin/employees/update/:account" element={<UpdateEmployee />} />
        <Route path="/admin/equipment" element={<EquipmentList />} />
        <Route path="/admin/equipment/add" element={<AddEquipment />} />
        <Route path="/admin/equipment/update/:id" element={<UpdateEquipment />} />
        <Route path="/admin/classes" element={<ClassList />} />
        <Route path="/admin/classes/add" element={<AddClass />} />
        <Route path="/admin/classes/update/:id" element={<UpdateClass />} />
        <Route path="/admin/classes/orders/:classId" element={<ClassOrderList />} />
        <Route path="/admin/notifications" element={<NotificationManagement />} />
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/main" element={<UserMain />} />
        <Route path="/user/info/:account" element={<UserInfo />} />
        <Route path="/user/info/update/:account" element={<UpdateUserInfo />} />
        <Route path="/user/classes/:account" element={<UserClass />} />
        <Route path="/user/classes/apply/:account" element={<ApplyClass />} />
        <Route path="/user/equipment-booking/:account" element={<EquipmentBooking />} />
        <Route path="/user/equipment-booking/detail/:bookingId/:memberAccount" element={<BookingDetail />} />
        <Route path="/user/equipment/detail/:equipmentId/:memberAccount" element={<EquipmentDetail />} />
        <Route path="/user/share-requests/:account" element={<ShareRequests />} />
        <Route path="/user/notifications/:account" element={<UserNotifications />} />
      </Routes>
    </Router>
  );
}

export default App;
