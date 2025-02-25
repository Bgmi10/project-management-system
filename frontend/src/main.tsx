import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
    <ThemeProvider>
      <App />
      <Toaster position="top-right" />
      </ThemeProvider>
    </BrowserRouter>
);