import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import MainContent from './components/main-content';
// import { io } from "socket.io-client";

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <MainContent />
    </SidebarProvider>
  );
}

export default App;
