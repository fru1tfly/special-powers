import './App.css'
import Editor from './editor'
import { BrowserRouter, Route, Routes } from 'react-router'
import GameManager from './game/GameManager'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameManager />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
