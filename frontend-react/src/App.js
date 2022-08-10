import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Home from './Home';
import Verify from './Verify';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/verify' element={<Verify />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
