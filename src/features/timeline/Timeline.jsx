import { useMemo, useState } from 'react'
import {
  Award01Icon,
  ConstructionIcon,
  Flag02Icon,
  PackageIcon,
  Rocket01Icon,
  School01Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import BranchedMenu from './BranchedMenu.jsx'
import './timeline.css'

const timelineItems = [
  { time: '10:00 AM', title: 'Opening Ceremony', description: 'Welcome address and official inauguration of Aerotech 2026.', day: 'DAY 1 — FEB 25', icon: Flag02Icon },
  { time: '10:30 AM', title: 'Aero Modeling Workshop', description: 'Hands-on workshop covering the fundamentals of aero modeling, aerodynamics, and aircraft design.', day: 'DAY 1 — FEB 25', icon: School01Icon },
  { time: '11:30 AM', title: 'Materials & Kit Distribution', description: 'Teams receive their building materials and kits to begin constructing their aircraft.', day: 'DAY 1 — FEB 25', icon: PackageIcon },
  { time: '12:00 PM', title: 'Build Phase Begins', description: 'Students start designing and building their model airplanes using the provided kits.', day: 'DAY 1 — FEB 25', icon: ConstructionIcon },
  { time: '10:00 AM', title: 'Flight Testing', description: 'Teams test-fly their built aircraft. Performance is evaluated on distance, stability, and design.', day: 'DAY 2 — FEB 26', icon: Settings02Icon },
  { time: '01:00 PM', title: 'Top Teams Competition', description: 'The best-performing teams compete head-to-head for the top positions.', day: 'DAY 2 — FEB 26', icon: Rocket01Icon },
  { time: '03:00 PM', title: 'Results & Awards Ceremony', description: 'Winners are announced and prizes are distributed. Closing of Aerotech 2026.', day: 'DAY 2 — FEB 26', icon: Award01Icon },
]

const groupedTimeline = Array.from(
  timelineItems.reduce((map, item) => {
    const key = item.day
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key).push(item)
    return map
  }, new Map()).entries(),
).map(([day, events]) => ({
  label: day,
  children: events.map((event) => ({
    value: `${event.day}-${event.time}`,
    label: `${event.time} — ${event.title}`,
    icon: event.icon,
    data: event,
  })),
}))

function Timeline() {
  const [selectedValue, setSelectedValue] = useState(`${timelineItems[0].day}-${timelineItems[0].time}`)
  const selectedItem = useMemo(
    () => timelineItems.find((item) => `${item.day}-${item.time}` === selectedValue) ?? timelineItems[0],
    [selectedValue],
  )

  return (
    <section className="timeline-section" aria-labelledby="event-timeline-title">
      <div className="timeline-shell">
        <header className="timeline-header">
          <span className="timeline-kicker">Event schedule</span>
          <h2 id="event-timeline-title">EVENT TIMELINE</h2>
        </header>

        <div className="timeline-layout">
          <div className="timeline-menu-wrap">
            <BranchedMenu
              items={groupedTimeline}
              defaultOpen={[0, 1]}
              defaultActive={selectedValue}
              onSelect={(value) => setSelectedValue(value)}
              color="#111827"
              accentColor="#111827"
              lineColor="#4b4d53"
              width={430}
              rowHeight={42}
              indent={44}
              trunk={14}
              radius={12}
              lineWidth={1.5}
              fontSize={15}
              drawDuration={420}
              foldDuration={280}
            />
          </div>

          <aside className="timeline-details" aria-live="polite">
            <div className="timeline-details-header">
              <span className="timeline-details-pill">{selectedItem.day}</span>
            </div>

            <div className="timeline-details-body">
              <div className="timeline-details-copy">
                <div className="timeline-details-time">{selectedItem.time}</div>
                <h3>{selectedItem.title}</h3>
                <p>{selectedItem.description}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default Timeline
