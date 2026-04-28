import './env'; // validate env vars before anything else
import { api } from '@typedframe/core';
import ReactDOM from 'react-dom/client';
import App from './App';
import { env } from './env';

api.defaults.baseURL = env.VITE_API_BASE_URL;

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
