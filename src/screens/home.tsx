// S1 홈: 실외 지도 + 검색창 (docs/SPEC.md)
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Geo } from '../routing/index.ts';
import { entrancesWithGeo } from '../data/index.ts';
import { useLocation } from '../location/LocationProvider.tsx';
import { DemoBanner, FloatingButton, Icon, SecondaryButton } from '../ui/common.tsx';
import { OutdoorMap } from '../ui/OutdoorMap.tsx';
import { useTheme } from '../ui/theme.ts';

export default function Home() {
  const t = useTheme();
  const navigate = useNavigate();
  const { coords, status, refresh } = useLocation();
  const [focus, setFocus] = useState<Geo | null>(null);
  const entrances = entrancesWithGeo().map((n) => n.id);

  const recenter = () => {
    refresh();
    if (coords) setFocus({ ...coords });
  };

  return (
    <div className="screen">
      <OutdoorMap me={coords} entranceIds={entrances} focus={focus} />

      <div className="home-top">
        <button type="button" role="search" aria-label="5호관 강의실·연구실 검색" onClick={() => navigate('/search?field=to')} className="search-box">
          <Icon name="magnify" color={t.primary} />
          <span className="t-body">5호관 강의실·연구실 검색</span>
        </button>
        <DemoBanner />
      </div>

      <FloatingButton icon="crosshairs-gps" label="현재 위치로" onPress={recenter} className="home-gps" />

      {(status === 'denied' || status === 'unavailable') && (
        <div className="home-notice">
          <span className="t-small" style={{ flex: 1 }}>
            {status === 'denied' ? '위치 권한이 꺼져 있어요. 입구에서 출발하는 경로로 안내합니다.' : '현재 위치를 가져오지 못했어요.'}
          </span>
          <SecondaryButton title="다시 시도" onPress={refresh} style={{ minHeight: 40 }} />
        </div>
      )}
    </div>
  );
}
