import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AgendaEvent } from '../data/types';
import { eventDate, eventsForDay } from '../domain/agenda';
import { layoutCalendarDay } from '../domain/calendarLayout';
import { dayKey } from '../domain/tasks';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

const HOUR = 68;
const GUTTER = 46;
export function CalendarTimeline({ events, selected, now, weekly, onEventPress }: {
  events: AgendaEvent[]; selected: Date; now: Date; weekly: boolean; onEventPress: (event: AgendaEvent) => void;
}) {
  const { colors, styles } = useThemeStyles(createStyles);
  const { width } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const horizontal = useRef<ScrollView>(null);
  const first = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - (weekly ? (selected.getDay() + 6) % 7 : 0));
  const days = Array.from({ length: weekly ? 7 : 1 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index));
  const columnWidth = weekly ? Math.max(144, (width - 80) / 3) : Math.max(180, width - spacing.lg * 2 - GUTTER);
  const selectedKey = dayKey(selected);
  useEffect(() => {
    const timer = setTimeout(() => {
      const today = selectedKey === dayKey(new Date());
      scroll.current?.scrollTo({ y: Math.max(0, (today ? new Date().getHours() - 1 : 7) * HOUR), animated: false });
      horizontal.current?.scrollTo({ x: weekly ? ((selected.getDay() + 6) % 7) * columnWidth : 0, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedKey, weekly, columnWidth]);
  const allDayHeight = Math.max(38, ...days.map((day) => eventsForDay(events, day).filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.start)).length * 32 + 6));
  return <View style={styles.root}>
    {weekly ? <Text style={styles.hint}>Deslize para os lados para ver a semana.</Text> : null}
    <ScrollView ref={scroll} style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator>
      <ScrollView ref={horizontal} horizontal scrollEnabled={weekly} nestedScrollEnabled showsHorizontalScrollIndicator={weekly}>
        <View style={{ width: GUTTER + days.length * columnWidth }}>
          <View style={[styles.header, { paddingLeft: GUTTER }]}>{days.map((day) => <View key={dayKey(day)} style={{ width: columnWidth, padding: spacing.sm }}>
            <Text style={[styles.dayLabel, dayKey(day) === dayKey(now) ? { color: colors.accent } : null]}>{day.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
          </View>)}</View>
          <View style={[styles.allDay, { height: allDayHeight }]}><Text style={[styles.allDayLabel, { width: GUTTER }]}>Dia todo</Text>
            {days.map((day) => <View key={dayKey(day)} style={{ width: columnWidth, paddingHorizontal: 3, gap: 3 }}>
              {eventsForDay(events, day).filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.start)).map((event) =>
                <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={`Detalhes: ${event.title}`} onPress={() => onEventPress(event)} style={styles.allDayChip}><Text numberOfLines={1} style={styles.eventTitle}>{event.title}</Text></Pressable>)}
            </View>)}
          </View>
          <View style={{ height: HOUR * 24 + 18, marginTop: 8 }}>
            {Array.from({ length: 25 }, (_, hour) => <View key={hour} pointerEvents="none" style={[styles.hourRow, { top: hour * HOUR }]}>
              <Text style={[styles.hourLabel, { width: GUTTER }]}>{String(hour % 24).padStart(2, '0')}:00</Text><View style={styles.hourLine} />
            </View>)}
            {days.map((day, dayIndex) => <View key={dayKey(day)} style={[styles.column, { left: GUTTER + dayIndex * columnWidth, width: columnWidth }]}>
              {layoutCalendarDay(eventsForDay(events, day), day).map(({ event, lane, laneCount, startMinute, endMinute }) => {
                const category = { personal: 0, work: 4, study: 1, shopping: 2, project: 3 };
                const tint = colors.categoryPalette[category[event.category ?? 'personal']];
                const height = Math.max(24, (endMinute - startMinute) * HOUR / 60 - 3);
                return <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={`${event.title}, ${eventDate(event.start).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`}
                  onPress={() => onEventPress(event)} style={[styles.event, { top: startMinute * HOUR / 60 + 1, height,
                    left: `${lane * 100 / laneCount}%`, width: `${100 / laneCount}%`, backgroundColor: colors.card, borderLeftColor: tint }]}>
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: 0.16 }]} />
                  <Text numberOfLines={height < 50 ? 1 : 2} style={styles.eventTitle}>{event.title}</Text>
                  {height >= 40 ? <Text numberOfLines={1} style={styles.eventMeta}>{eventDate(event.start).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}–{eventDate(event.end).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</Text> : null}
                  {height >= 66 && event.location ? <Text numberOfLines={1} style={styles.eventMeta}>{event.location}</Text> : null}
                </Pressable>;
              })}
              {dayKey(day) === dayKey(now) ? <View pointerEvents="none" style={[styles.nowLine, { top: (now.getHours() * 60 + now.getMinutes()) * HOUR / 60 }]}><View style={styles.nowDot} /></View> : null}
            </View>)}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  </View>;
}
const createStyles = (colors: AppColors) => StyleSheet.create({
  root: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
  scroll: { height: 510 }, hint: { ...typography.tiny, color: colors.textMuted, padding: spacing.sm },
  header: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border }, dayLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  allDay: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border, paddingTop: 4 },
  allDayLabel: { ...typography.tiny, color: colors.textMuted, padding: 4 }, allDayChip: { height: 28, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 6, backgroundColor: colors.accentSoft },
  hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  hourLabel: { ...typography.tiny, color: colors.textMuted, fontSize: 10, marginTop: -8, paddingLeft: 3 }, hourLine: { height: StyleSheet.hairlineWidth, flex: 1, backgroundColor: colors.border },
  column: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  event: { position: 'absolute', borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3, overflow: 'hidden', borderRightWidth: 2, borderRightColor: colors.card },
  eventTitle: { ...typography.tiny, color: colors.textPrimary, fontWeight: '700' }, eventMeta: { fontSize: 10, lineHeight: 14, color: colors.textSecondary },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.danger }, nowDot: { width: 8, height: 8, position: 'absolute', top: -3, left: -4, borderRadius: 4, backgroundColor: colors.danger },
});
