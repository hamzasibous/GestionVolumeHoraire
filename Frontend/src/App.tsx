import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProgramsManagement from './components/ProgramsManagement'
import FacultyAssignments from './components/FacultyAssignments'
import ForecastingSimulation from './components/ForecastingSimulation'
import TeacherConsultation from './components/TeacherConsultation'
import AddFiliere from './components/AddFiliere'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/programs" element={<ProgramsManagement />} />
        <Route path="/programs/new" element={<AddFiliere />} />
        <Route path="/faculty" element={<FacultyAssignments />} />
        <Route path="/forecasting" element={<ForecastingSimulation />} />
        <Route path="/consultation" element={<TeacherConsultation />} />
      </Routes>
    </Layout>
  )
}

export default App
