
import ReactDOM from 'react-dom/client';
import 'src/index.css';
import App from 'src/App';
import { StoreProvider } from './context/context';
import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    // FIXME: PP-649 add <React.StrictMode>
    <StoreProvider>
        <App />
    </StoreProvider>
);