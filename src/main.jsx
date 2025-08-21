import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FileAndTextHasher from './FileAndTextHasher.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FileAndTextHasher/>
  </StrictMode>,
)
