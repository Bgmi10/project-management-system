import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { FormProvider } from './context/FormContext.tsx';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
    <ThemeProvider>
    <FormProvider>
      <App />
    </FormProvider>
      <Toaster position="top-right" />
    </ThemeProvider>
    </BrowserRouter>
);