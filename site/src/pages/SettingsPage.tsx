import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { DAY_LABELS } from '../lib/weekPlan'
import {
  loadFirstDayOfWeekIndex,
  saveFirstDayOfWeekIndex,
} from '../lib/weekPlanStorage'

export default function SettingsPage() {
  const [firstDayIndex, setFirstDayIndex] = useState(() =>
    loadFirstDayOfWeekIndex(),
  )
  const [statusMessage, setStatusMessage] = useState('')

  const handleFirstDayChange = useCallback((dayIndex: number) => {
    setFirstDayIndex(dayIndex)
    saveFirstDayOfWeekIndex(dayIndex)
    setStatusMessage('First day of week saved on this device.')
  }, [])

  return (
    <>
      <h1>Settings</h1>
      <p className="lede">
        Preferences are stored in this browser only (<code>localStorage</code>
        ).
      </p>

      <section className="settings-section" aria-labelledby="settings-week-heading">
        <h2 id="settings-week-heading" className="settings-section__title">
          Week planner
        </h2>
        <div className="settings-field">
          <label htmlFor="first-day-of-week">First day of week</label>
          <p id="first-day-hint" className="settings-field__hint">
            The week plan columns start on this day (for example, Tuesday if
            your grocery delivery defines how you plan).
          </p>
          <select
            id="first-day-of-week"
            value={String(firstDayIndex)}
            onChange={(e) => handleFirstDayChange(Number(e.target.value))}
            aria-describedby="first-day-hint"
          >
            {DAY_LABELS.map((dayLabel, dayIndex) => (
              <option key={dayLabel} value={dayIndex}>
                {dayLabel}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p className="status" aria-live="polite">
        {statusMessage}
      </p>

      <p className="settings-back">
        <Link to="/">← Back to week plan</Link>
      </p>
    </>
  )
}
