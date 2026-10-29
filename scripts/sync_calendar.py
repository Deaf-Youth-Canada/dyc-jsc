"""Convert the dedicated public Google Calendar to a minimal website snapshot."""
import json
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import urlopen
from zoneinfo import ZoneInfo
from icalendar import Calendar
import recurring_ical_events

FEED = 'https://calendar.google.com/calendar/ical/c_0189f173417acc31373d77ace1604040364cb4f7368513314d6154544244b7af%40group.calendar.google.com/public/basic.ics'
ZONE = ZoneInfo('America/Edmonton')
ROOT = Path(__file__).resolve().parent.parent

class PlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('br', 'p', 'div', 'li'):
            self.parts.append('\n')
        if tag == 'a':
            for key, value in attrs:
                if key == 'href' and value and value.startswith(('https://', 'http://')):
                    self.parts.append(value + ' ')
    def handle_data(self, text):
        self.parts.append(text)

def plain(value):
    parser = PlainText()
    parser.feed(str(value or ''))
    return '\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())[:10000]

def aware(value):
    return value.replace(tzinfo=ZONE) if value.tzinfo is None else value.astimezone(ZONE)

def build_feed(raw, now=None):
    now = now or datetime.now(timezone.utc)
    calendar = Calendar.from_ical(raw)
    if calendar.name != 'VCALENDAR' or not calendar.get('VERSION'):
        raise ValueError('Expected a valid public iCalendar feed')
    today = now.astimezone(ZONE).date()
    first, last = today - timedelta(days=366), today + timedelta(days=731)
    events = []
    for item in recurring_ical_events.of(calendar).between(first, last):
        if str(item.get('STATUS', '')).upper() == 'CANCELLED' or str(item.get('CLASS', '')).upper() in ('PRIVATE', 'CONFIDENTIAL'):
            continue
        start = item.decoded('DTSTART')
        end = item.decoded('DTEND', None)
        all_day = not isinstance(start, datetime)
        if all_day:
            end = end or start + timedelta(days=1)
            if end <= start:
                end = start + timedelta(days=1)
            start_day, end_day = start, end - timedelta(days=1)
        else:
            start = aware(start)
            end = aware(end) if end else start
            if end < start:
                raise ValueError('Event ends before it begins')
            start_day = start.date()
            end_day = (end - timedelta(microseconds=1)).date() if end > start else start_day
        events.append({'title': str(item.get('SUMMARY', '')).strip()[:500] or 'DYC / JSC',
                       'start': start.isoformat(), 'end': end.isoformat(), 'allDay': all_day,
                       'startDay': start_day.isoformat(), 'endDay': end_day.isoformat(),
                       'location': plain(item.get('LOCATION')), 'description': plain(item.get('DESCRIPTION'))})
    events.sort(key=lambda event: (event['startDay'], event['start'], event['title']))
    return {'version': 1, 'timeZone': str(ZONE), 'windowStart': first.isoformat(),
            'windowEnd': last.isoformat(), 'checkedAt': now.isoformat(), 'events': events}

def sync():
    with urlopen(FEED, timeout=45) as response:
        raw = response.read(10_000_001)
    if len(raw) > 10_000_000:
        raise ValueError('Public calendar feed exceeds size limit')
    result = build_feed(raw)
    destination = ROOT / 'events.json'
    if destination.exists():
        previous = json.loads(destination.read_text())
        # The rolling date window advances daily; unchanged checks do not create commits.
        if {k:v for k,v in previous.items() if k != 'checkedAt'} == {k:v for k,v in result.items() if k != 'checkedAt'}:
            print('Public events unchanged; retained current snapshot.')
            return
    temporary = destination.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(destination)
    print(f"Saved {len(result['events'])} public event occurrences.")

if __name__ == '__main__':
    sync()

