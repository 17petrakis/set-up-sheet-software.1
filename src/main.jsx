import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import lockViewport from '@/lib/viewportLock'

lockViewport()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)