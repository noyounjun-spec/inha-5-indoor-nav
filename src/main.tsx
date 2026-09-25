// 앱 시작점: 화면 주소(라우트)와 공통 틀
// HashRouter(/#/search 형태)를 써서 정적 호스팅 어디에 올려도 새로고침·직접 접속이 된다.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router';
import { LocationProvider } from './location/LocationProvider.tsx';
import { applyThemeVars } from './ui/theme.ts';
import Home from './screens/home.tsx';
import Search from './screens/search.tsx';
import RouteList from './screens/routes.tsx';
import RouteDetail from './screens/route-detail.tsx';
import Navigate from './screens/navigate.tsx';
import Arrive from './screens/arrive.tsx';
import './ui/styles.css';

applyThemeVars();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <LocationProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/routes" element={<RouteList />} />
            <Route path="/route-detail" element={<RouteDetail />} />
            <Route path="/navigate" element={<Navigate />} />
            <Route path="/arrive" element={<Arrive />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </LocationProvider>
    </HashRouter>
  </StrictMode>,
);
