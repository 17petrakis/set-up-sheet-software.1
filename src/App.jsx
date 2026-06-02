import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { EmployeeAuthProvider } from '@/lib/EmployeeAuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import SetupSheet from '@/pages/SetupSheet';
import Home from '@/pages/Home';
import PrintView from '@/pages/PrintView';
import ToolListPrint from '@/pages/ToolListPrint';
import Login from '@/pages/Login';
import ManageEmployees from '@/pages/admin/ManageEmployees';
// Add page imports here

const AuthenticatedApp = () => {
  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/sheet/:id" element={<SetupSheet />} />
        <Route path="/sheet/:id/print" element={<PrintView />} />
        <Route path="/sheet/:id/print-tools" element={<ToolListPrint />} />
        <Route path="/admin/employees" element={<ManageEmployees />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <EmployeeAuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </EmployeeAuthProvider>
  )
}

export default App