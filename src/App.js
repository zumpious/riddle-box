import React from 'react'
import './App.css'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation
} from 'react-router-dom'
import { CookiesProvider } from 'react-cookie'
import NineLamps from './games/nine_lamps/NineLamps'
import ColorCodeGuesser from './games/color_code_guesser/ColorCodeGuesser'
import HorseRacing from './games/horse_racing/HorseRacing'
import Menu from './components/menu/Menu'
import Home from './screens/Home'

const Layout = () => {
  const location = useLocation()
  const hideMenu = location.pathname === '/horse-racing'
  return (
    <div className="App">
      {!hideMenu && <Menu />}
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nine-lamps" element={<NineLamps />} />
          <Route path="/color-code-guesser" element={<ColorCodeGuesser />} />
          <Route path="/horse-racing" element={<HorseRacing />} />
        </Routes>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <CookiesProvider>
      <Router>
        <Layout />
      </Router>
    </CookiesProvider>
  )
}

export default App
