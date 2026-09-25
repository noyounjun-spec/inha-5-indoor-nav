// S2 검색: 호수·관·이름·별칭으로 방 찾기 (docs/SPEC.md)
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graph } from '../src/data/index.ts';
import { ENTRANCES, ME, placeLabel } from '../src/lib/places.ts';
import { buildSearchIndex, search, type SearchItem } from '../src/lib/search.ts';
import { addRecent, setTrip, useTrip } from '../src/state/trip.ts';
import { DemoBanner, Icon, IconButton, type IconName } from '../src/ui/common.tsx';
import { fontSize, TOUCH, useTheme } from '../src/ui/theme.ts';

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
  const insets = useSafeAreaInsets();
  const { field = 'to', back } = useLocalSearchParams<{ field?: 'from' | 'to'; back?: string }>();
  const { recent } = useTrip();
  const [q, setQ] = useState('');

  const rows: Row[] = useMemo(() => {
    if (q.trim()) return search(index, q).map(toRow);
    const special: Row[] =
      field === 'from'
        ? [
            { id: ME, icon: 'crosshairs-gps', title: '내 위치' },
            { id: ENTRANCES, icon: 'door-open', title: '5호관 입구', subtitle: '가장 알맞은 입구에서 출발' },
          ]
        : [];
    const recents = recent
      .map((id) => index.find((i) => i.id === id))
      .filter((i): i is SearchItem => !!i)
      .map((i) => ({ ...toRow(i), icon: 'history' as const }));
    return [...special, ...recents];
  }, [q, field, recent]);

  const choose = (id: string) => {
    if (id !== ME && id !== ENTRANCES) addRecent(id);
    setTrip(field === 'from' ? { from: id } : { to: id });
    if (back) router.back();
    else router.replace('/routes');
  };

  return (
    <View style={[styles.fill, { backgroundColor: t.surface, paddingTop: insets.top }]}>
      <View style={[styles.bar, { borderColor: t.border }]}>
        <IconButton icon="chevron-left" label="뒤로" onPress={() => router.back()} />
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder={field === 'from' ? '출발지 검색' : '도착지 검색 (예: 234, 5남 234, 학과사무실)'}
          placeholderTextColor={t.subtext}
          returnKeyType="search"
          style={[styles.input, { color: t.text, backgroundColor: t.bg }]}
        />
        {q ? <IconButton icon="close" label="지우기" onPress={() => setQ('')} /> : <View style={{ width: 8 }} />}
      </View>
      <DemoBanner style={{ margin: 12, marginBottom: 0 }} />

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          !q.trim() && rows.some((r) => r.icon === 'history') ? (
            <Text style={[styles.section, { color: t.subtext }]}>최근 검색</Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: t.subtext }]}>
            {q.trim() ? '검색 결과가 없어요' : '호수(234), 관+호수(5남 234), 방 이름으로 찾을 수 있어요'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => choose(item.id)}
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? t.bg : 'transparent' }]}
          >
            <Icon name={item.icon} color={item.id === ME ? t.primary : t.subtext} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: fontSize.body }}>{item.id === ME || item.id === ENTRANCES ? item.title : placeLabel(graph, item.id)}</Text>
              {item.subtitle && <Text style={{ color: t.subtext, fontSize: fontSize.small }}>{item.subtitle}</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, minHeight: TOUCH, borderRadius: 10, paddingHorizontal: 12, fontSize: fontSize.body },
  section: { fontSize: fontSize.small, fontWeight: '600', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  empty: { textAlign: 'center', padding: 32, fontSize: fontSize.body },
  row: { minHeight: TOUCH + 12, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 8 },
});
