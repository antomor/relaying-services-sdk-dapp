
import ReactDOM from 'react-dom/client';
import 'src/index.css';
import App from 'src/App';
import reportWebVitals from 'src/reportWebVitals';
import { StoreProvider } from './context/context';
import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
   // <React.StrictMode>
        <StoreProvider>
            <App />
        </StoreProvider>
    //</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();