import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme/palette';
import { MicaEvent } from '../types';
import * as H from '../utils/haptics';
import { dateIsoToDisplay, formatDays, effectiveDaysUntil } from '../utils/yearProgress';
import EventRow from './EventRow';

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Horizontal space removed from the screen width when computing the grid:
// outer padding 22×2 = 44, card padding 18×2 = 36 → 80 total
const H_PAD = 22 * 2 + 18 * 2;

function isoToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function buildIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Returns a 7×n grid (null = empty padding cell). */
function buildGrid(year: number, month: number): Array<string | null> {
  const firstDow    = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: Array<string | null> = [];
  for (let i = 0; i < firstDow; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(buildIso(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

/** Match events to a specific ISO date, honouring repeat rules. */
function getEventsForIso(events: MicaEvent[], iso: string): MicaEvent[] {
  const isoMonthDay = iso.slice(5); // MM-DD
  const isoDayNum   = iso.slice(8); // DD
  return events.filter(ev => {
    if (!ev.dateIso) return false;
    if (ev.repeats === 'Yearly')  return ev.dateIso.slice(5) === isoMonthDay;
    if (ev.repeats === 'Monthly') return ev.dateIso.slice(8) === isoDayNum;
    return ev.dateIso === iso;
  });
}

interface Props {
  events: MicaEvent[];
  t: Theme;
  onEventPress: (eventId: string) => void;
  /** Optional: shown in the empty-day panel so the user can add an event. */
  onAddPress?: () => void;
}

export default function CalendarView({ events, t, onEventPress, onAddPress }: Props) {
  const today = isoToday();
  const now   = new Date();

  const [year,        setYear       ] = useState(now.getFullYear());
  const [month,       setMonth      ] = useState(now.getMonth()); // 0-indexed
  const [selectedIso, setSelectedIso] = useState<string>(today);

  const { width: screenWidth } = useWindowDimensions();
  const gridWidth   = screenWidth - H_PAD;
  const cellSize    = Math.floor(gridWidth / 7);
  // Circle sits inside the cell with a small margin on each side
  const circleSize  = Math.min(34, cellSize - 6);
  // Touch target must be ≥44 px; dots row (8 px) sits below the circle
  const cellHeight  = Math.max(44, circleSize + 4 + 8);

  const grid = buildGrid(year, month);
  const weeks: Array<Array<string | null>> = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  function prevMonth() {
    H.selectionAsync();
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear  = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedIso(buildIso(newYear, newMonth, 1));
  }

  function nextMonth() {
    H.selectionAsync();
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear  = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedIso(buildIso(newYear, newMonth, 1));
  }

  function selectDate(iso: string) {
    if (iso === selectedIso) return; // already selected — skip re-render + haptic
    H.selectionAsync();
    setSelectedIso(iso);
  }

  const selectedEvents  = getEventsForIso(events, selectedIso);
  const selectedDisplay = dateIsoToDisplay(selectedIso);

  return (
    <View style={styles.root}>
      {/* ── Calendar card ─────────────────────────────────────────── */}
      <View style={[styles.calCard, { backgroundColor: t.surface, borderColor: t.border }]}>

        {/* Month navigation — 44×44 buttons for reliable tap targets */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={prevMonth}
            style={styles.navBtn}
            accessibilityLabel="Previous month"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color={t.accentStrong} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: t.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={styles.navBtn}
            accessibilityLabel="Next month"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-forward" size={20} color={t.accentStrong} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week header — opacity on t.text so contrast holds in dark mode */}
        <View style={styles.dowRow}>
          {DOW_LABELS.map(d => (
            <View key={d} style={[styles.dowCell, { width: cellSize }]}>
              <Text style={[styles.dowLabel, { color: t.text, opacity: 0.4 }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((iso, di) => {
              if (!iso) {
                return <View key={`e-${wi}-${di}`} style={{ width: cellSize, height: cellHeight }} />;
              }

              const isToday    = iso === today;
              const isSelected = iso === selectedIso && !isToday;
              const isPast     = iso < today;
              const dayNum     = parseInt(iso.slice(8), 10);
              const dots       = getEventsForIso(events, iso).slice(0, 3);

              return (
                <TouchableOpacity
                  key={iso}
                  onPress={() => selectDate(iso)}
                  style={[styles.dayCell, { width: cellSize, height: cellHeight }]}
                  activeOpacity={0.7}
                  accessibilityLabel={`${dayNum} ${MONTH_NAMES[month]}${dots.length > 0 ? `, ${dots.length} event${dots.length > 1 ? 's' : ''}` : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: iso === selectedIso }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
                      isToday    && { backgroundColor: t.accentStrong },
                      isSelected && { backgroundColor: t.surfaceMuted, borderWidth: 1.5, borderColor: t.accentStrong },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        {
                          // Single-opacity dimming: keeps t.text baseline so contrast
                          // stays adequate even at 0.28 (≈3.6:1 on light theme).
                          color:      isToday ? t.onAccent : t.text,
                          opacity:    isPast ? 0.28 : 1,
                          fontWeight: isToday || isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>

                  {dots.length > 0 && (
                    <View style={styles.dotsRow}>
                      {dots.map((ev, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: ev.color }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Events for selected day ───────────────────────────────── */}
      <View style={[styles.dayEventsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.eyebrow, { color: t.textMuted }]}>
          {selectedDisplay.toUpperCase()}
        </Text>

        {selectedEvents.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={[styles.emptyText, { color: t.textMuted }]}>No events on this day</Text>
            {onAddPress && (
              <TouchableOpacity
                onPress={() => { H.impactAsync(H.ImpactFeedbackStyle.Light); onAddPress(); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.emptyAction, { color: t.accentStrong }]}>+ Add one</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          selectedEvents.map((ev, i) => (
            <EventRow
              key={ev.id}
              event={ev}
              t={t}
              subtitle={ev.type}
              rightLabel={formatDays(Math.max(0, effectiveDaysUntil(ev)))}
              isLast={i === selectedEvents.length - 1}
              onPress={() => {
                H.impactAsync(H.ImpactFeedbackStyle.Light);
                onEventPress(ev.id);
              }}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },

  // ── Calendar card ────────────────────────────────────────────────
  calCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    gap: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  // 44×44 so the button itself meets WCAG; no hitSlop needed
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dowCell: {
    alignItems: 'center',
    paddingVertical: 3,
  },
  // 12px bold + opacity on t.text → contrast ≈4.5:1 on light, stays readable on dark
  dowLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 13,
    lineHeight: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    height: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // ── Day events card ──────────────────────────────────────────────
  dayEventsCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  emptyText: {
    fontSize: 15,
  },
  emptyAction: {
    fontSize: 15,
    fontWeight: '700',
  },
});
