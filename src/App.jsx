import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import SetupSheet from '@/pages/SetupSheet';
import Home from '@/pages/Home';
import PrintView from '@/pages/PrintView';
import ToolListPrint from '@/pages/ToolListPrint';
import EmployeeLogin from '@/pages/EmployeeLogin';
import EmployeeManagement from '@/pages/EmployeeManagement';
import CMMSheet from '@/pages/CMMSheet';
import CMMPrintView from '@/pages/CMMPrintView';
import MachineToolListsHome from '@/pages/MachineToolListsHome';
import MachineToolList from '@/pages/MachineToolList';
import MachineToolSync from '@/pages/MachineToolSync';
import TurningToolSync from '@/pages/TurningToolSync';
import Inventory from '@/pages/Inventory';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sheet/:id" element={<SetupSheet />} />
      <Route path="/sheet/:id/print" element={<PrintView />} />
      <Route path="/sheet/:id/print-tools" element={<ToolListPrint />} />
      <Route path="/employee-login" element={<EmployeeLogin />} />
      <Route path="/employee-management" element={<EmployeeManagement />} />
      <Route path="/cmm-sheet/:id" element={<CMMSheet />} />
      <Route path="/cmm-sheet/:id/print" element={<CMMPrintView />} />
      <Route path="/machine-tool-lists" element={<MachineToolListsHome />} />
      <Route path="/machine-tool-lists/:machineName" element={<MachineToolList />} />
      <Route path="/machine-tool-sync/:sheetId" element={<MachineToolSync />} />
      <Route path="/turning-tool-sync/:sheetId" element={<TurningToolSync />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App