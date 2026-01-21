import DataTable from './components/DataTable'
import { ToastProvider } from './components/ui/toast'

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <DataTable />
      </div>
    </ToastProvider>
  )
}

export default App
