import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/noto-sans-kr'
import './styles/tokens.css'
import './styles/global.css'
import './styles/ui.css'
import './styles/layout.css'
import './styles/pages.css'
import './styles/home-layout.css'
import './styles/home-dashboard.css'
import './styles/registration.css'
import './styles/status-screens.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

import './styles/foundation.css'

import './styles/phase2-v04.css'
import './styles/learning.css'
