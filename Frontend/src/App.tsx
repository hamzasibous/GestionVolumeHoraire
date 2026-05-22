import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProgramsManagement from './components/ProgramsManagement'
import FacultyAssignments from './components/FacultyAssignments'
import ForecastingSimulation from './components/ForecastingSimulation'
import TeacherConsultation from './components/TeacherConsultation'
import UserManagement from './components/UserManagement'
import AddFiliere from './components/AddFiliere'
import Timetable from './components/Timetable'
import CreateModule from './components/CreateModule'
import VacationManagement from './components/VacationManagement'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './components/Profile'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute> 
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/programs" element={<ProgramsManagement />} />
                <Route path="/programs/new" element={<AddFiliere />} />
                <Route path="/programs/new-module" element={<CreateModule />} />
                <Route path="/faculty" element={<FacultyAssignments />} />
                <Route path="/forecasting" element={<ForecastingSimulation />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/vacations" element={<VacationManagement />} />
                <Route path="/consultation" element={<TeacherConsultation />} />
                <Route path="/timetable" element={<Timetable />} />
              </Routes>
            </Layout>
          </ProtectedRoute>

        }
      />
    </Routes>
  )
}

export default App

