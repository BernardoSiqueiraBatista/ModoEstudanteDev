import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SimuladoRapido from './ModoEstudante/Simulado_Rapido';
import IniciarSimulado from './ModoEstudante/IniciarSimulado';
import ExecutarSimulado from './ModoEstudante/ExecutarSimulado'
import FinalizarSimulado from './ModoEstudante/FinalizarSimulado'
import DesempenhoSimulado from './ModoEstudante/DesempenhoSimulado'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Quando a URL for "/", mostra a tela de escolha */}
        <Route path="/" element={<SimuladoRapido />} />
        
        {/* Quando o navigate chamar "/IniciarSimulado", mostra a outra tela */}
        <Route path="/IniciarSimulado" element={<IniciarSimulado />} />
        <Route path="/simulado/executar" element={<ExecutarSimulado/>} />
        <Route path ="/simulado/desempenho" element={<DesempenhoSimulado/>} />
        <Route path = "/simulado/encerramento"element ={<FinalizarSimulado/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;