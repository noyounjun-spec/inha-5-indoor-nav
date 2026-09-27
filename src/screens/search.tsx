// S2 검색: 호수·관·이름·별칭으로 방 찾기 (docs/SPEC.md)
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { graph, hasEntranceGeo } from '../data/index.ts';
import { ENTRANCES, ME, placeLabel } from '../lib/places.ts';
import { useBack } from '../lib/nav.ts';
import { buildSearchIndex, search, type SearchItem } from '../lib/search.ts';
import { addRecent, setTrip, useTrip } from '../state/trip.ts';
import { DemoBanner, Icon, IconButton, type IconName } from '../ui/common.tsx';
import { useTheme } from '../ui/theme.ts';

const index = buildSearchIndex(graph);

interface Row {
  id: string;
  icon: IconName;
  title: string;
  subtitle?: string;
}

const toRow = (i: SearchItem): Row => ({ id: i.id, icon: i.kind === 'room' ? 'door' : 'door-open', title: i.title, subtitle: i.subtitle });

export default function Search() {
  const t = useTheme();
  const navigate = useNavigate();
  const back = useBack();
  const [params] = useSearchParams();
  const field = params.get('field') === 'from' ? 'from' : 'to';
  const returnBack = params.has('back');
  const { recent, to } = useTrip();
  const [q, setQ] = useState('');

  const hits = useMemo(() => (q.trim() ? search(index, q) : []), [q]);
  // 같은 호수가 여러 관에 있으면 관을 골라 달라고 한다 (docs/SPEC.md 검색)
  const sameNumber = useMemo(() => {
    const num = q.trim().toLowerCase().replace(/호$/, '');
    const exact = hits.filter((i) => i.number?.toLowerCase() === num);
    return new Set(exact.map((i) => i.building)).size > 1 ? num.toUpperCase() : null;
  }, [q, hits]);

  const rows: Row[] = useMemo(() => {
    if (q.trim()) return hits.map(toRow);
    const special: Row[] =
      field === 'from'
        ? [
            // 입구 위경도가 없으면 GPS 출발을 쓸 수 없어 "내 위치"를 보여 주지 않는다
            ...(hasEntranceGeo ? [{ id: ME, icon: 'crosshairs-gps' as const, title: '내 위치' }] : []),
            { id: ENTRANCES, icon: 'door-open', title: '5호관 입구', subtitle: '건물 밖에 있으면 가장 알맞은 입구에서 출발' },
          ]
        : [];
    const recents = recent
      .map((id) => index.find((i) => i.id === id))
      .filter((i): i is SearchItem => !!i)
      .map((i) => ({ ...toRow(i), icon: 'history' as const }));
    return [...special, ...recents];
  }, [q, hits, field, recent]);

  const choose = (id: string) => {
    if (id !== ME && id !== ENTRANCES) addRecent(id);
    setTrip(field === 'from' ? { from: id } : { to: id });
    if (returnBack) back();
    // 출발지만 정했고 도착지가 아직 없으면 도착지 검색으로 이어 간다
    else if (field === 'from' && !to) navigate('/search?field=to', { replace: true });
    else navigate('/routes', { replace: true });
  };

  return (
    <div className="screen" style={{ background: t.surface }}>
      <form
        className="search-bar safe-top"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          // 여러 관에 같은 호수가 있으면 첫 결과를 고르지 않고 사용자가 고르게 한다
          if (q.trim() && rows[0] && !sameNumber) choose(rows[0].id);
        }}
      >
        <IconButton icon="chevron-left" label="뒤로" onPress={back} />
        <input
          autoFocus
          type="search"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={field === 'from' ? '근처에 보이는 호실 (예: 123, 5북 448)' : '도착지 검색 (예: 234, 5남 234, 학과사무실)'}
          aria-label={field === 'from' ? '출발지 검색' : '도착지 검색'}
          className="search-input"
        />
        {q ? <IconButton icon="close" label="지우기" onPress={() => setQ('')} /> : <span style={{ width: 8 }} />}
      </form>
      <DemoBanner style={{ margin: '12px 12px 0' }} />

      <div className="list">
        {field === 'from' && !q.trim() && (
          <div className="banner-note notice" style={{ margin: '12px 12px 0' }}>
            <Icon name="map-marker" size={16} />
            <span>지금 있는 곳 근처에 보이는 호실 번호를 입력하면, 그 방 앞에서 출발하는 길을 찾아 드려요.</span>
          </div>
        )}
        {sameNumber && <div className="section">{sameNumber}호가 여러 관에 있어요. 관을 골라 주세요</div>}
        {!q.trim() && rows.some((r) => r.icon === 'history') && <div className="section">최근 검색</div>}
        {rows.length === 0 && (
          <div className="empty">{q.trim() ? '검색 결과가 없어요' : '호수(234), 관+호수(5남 234), 방 이름으로 찾을 수 있어요'}</div>
        )}
        {rows.map((item) => (
          <button key={item.id} type="button" onClick={() => choose(item.id)} className="row">
            <Icon name={item.icon} color={item.id === ME ? t.primary : t.subtext} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="t-body" style={{ display: 'block' }}>
                {item.id === ME || item.id === ENTRANCES ? item.title : placeLabel(graph, item.id)}
              </span>
              {item.subtitle && <span className="t-small sub">{item.subtitle}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
