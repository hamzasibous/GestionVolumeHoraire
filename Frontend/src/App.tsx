import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProgramsManagement from './components/ProgramsManagement'
import FacultyAssignments from './components/FacultyAssignments'
import ForecastingSimulation from './components/ForecastingSimulation'
import TeacherConsultation from './components/TeacherConsultation'
import TeacherTimetable from './components/TeacherTimetable'
import UserManagement from './components/UserManagement'
import AddFiliere from './components/AddFiliere'
import Timetable from './components/Timetable'
import CreateModule from './components/CreateModule'
import VacationManagement from './components/VacationManagement'
import LocalManagement from './components/LocalManagement'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './components/Profile'

function App() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchRole = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setRole(null);
        setLoading(false);
        return;
      }

      // If we already have a role, don't re-fetch unless on login/root
      if (role && location.pathname !== '/login') {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/users/profile/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
        } else if (response.status === 401) {
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching role in App:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [location.pathname]); // Re-fetch on navigation to handle post-login state

  if (loading && localStorage.getItem('access_token')) return null;

  const isAdmin = role === 'ADMIN' || role === 'CHEF_DEPARTEMENT';
  const isEnseignant = role === 'ENSEIGNANT';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute> 
            <Layout>
              <Routes>
                {/* Admin or Default Dashboard */}
                <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/consultation" />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Admin Only Routes */}
                {isAdmin ? (
                  <>
                    <Route path="/programs" element={<ProgramsManagement />} />
                    <Route path="/programs/new" element={<AddFiliere />} />
                    <Route path="/programs/new-module" element={<CreateModule />} />
                    <Route path="/faculty" element={<FacultyAssignments />} />
                    <Route path="/forecasting" element={<ForecastingSimulation />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/vacations" element={<VacationManagement />} />
                    <Route path="/locals" element={<LocalManagement />} />
                    <Route path="/timetable" element={<Timetable />} />
                  </>
                ) : null}

                {/* Shared or User Routes */}
                <Route path="/consultation" element={<TeacherConsultation />} />
                <Route path="/my-timetable" element={<TeacherTimetable />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to={isAdmin ? "/" : "/consultation"} />} />
              </Routes>
            </Layout>
          </ProtectedRoute>

        }
      />
    </Routes>
  )
}

export default App

