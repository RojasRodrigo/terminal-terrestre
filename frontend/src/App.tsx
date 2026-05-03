import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useStore } from '@/store';
import Dashboard   from '@/pages/Dashboard';
import Rutas       from '@/pages/Rutas';
import Despachos   from '@/pages/Despachos';
import { Bus, Map, LayoutDashboard, Wifi, WifiOff } from 'lucide-react';

const qc = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  useWebSocket();
  const wsConectado = useStore(s => s.wsConectado);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#1e293b', color: '#e2e8f0',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Sistema</p>
          <h1 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>
            Terminal Terrestre
          </h1>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, marginTop: 8,
            color: wsConectado ? '#4ade80' : '#f87171',
          }}>
            {wsConectado ? <Wifi size={12}/> : <WifiOff size={12}/>}
            {wsConectado ? 'En línea' : 'Desconectado'}
          </span>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { to: '/',          label: 'Dashboard',  Icon: LayoutDashboard },
            { to: '/rutas',     label: 'Red de rutas', Icon: Map },
            { to: '/despachos', label: 'Despachos',  Icon: Bus },
          ].map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 4,
              textDecoration: 'none', fontSize: 14,
              color: isActive ? '#f1f5f9' : '#94a3b8',
              background: isActive ? '#334155' : 'transparent',
            })}>
              <Icon size={16}/>{label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: 28 }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/"          element={<Dashboard/>}/>
                <Route path="/rutas"     element={<Rutas/>}/>
                <Route path="/despachos" element={<Despachos/>}/>
              </Routes>
            </Layout>
          }/>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
