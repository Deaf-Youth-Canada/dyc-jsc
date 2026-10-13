import unittest
from datetime import datetime, timezone
from scripts.sync_calendar import build_feed
NOW = datetime(2026, 10, 9, tzinfo=timezone.utc)
def feed(events):
    return ('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//DYC tests//EN\r\n' + events + 'END:VCALENDAR\r\n').encode()
def event(uid, fields):
    return f'BEGIN:VEVENT\r\nUID:{uid}\r\n{fields}\r\nEND:VEVENT\r\n'
class CalendarTests(unittest.TestCase):
    def test_all_day_exclusive_end_private_and_cancelled(self):
        raw = event('camp', 'DTSTART;VALUE=DATE:20261010\r\nDTEND;VALUE=DATE:20261013\r\nSUMMARY:Camp')
        raw += event('private', 'DTSTART:20261010T180000Z\r\nCLASS:PRIVATE\r\nSUMMARY:Internal')
        raw += event('cancelled', 'DTSTART:20261010T180000Z\r\nSTATUS:CANCELLED')
        data = build_feed(feed(raw), NOW)['events']
        self.assertEqual(len(data), 1)
        self.assertEqual((data[0]['startDay'], data[0]['endDay']), ('2026-10-10', '2026-10-12'))
    def test_recurrence_exclusion_override_and_dst(self):
        raw = event('weekly', 'DTSTART;TZID=America/Edmonton:20261025T120000\r\nDTEND;TZID=America/Edmonton:20261025T130000\r\nRRULE:FREQ=WEEKLY;COUNT=4\r\nEXDATE;TZID=America/Edmonton:20261108T120000\r\nSUMMARY:Meetup')
        raw += event('weekly', 'RECURRENCE-ID;TZID=America/Edmonton:20261115T120000\r\nDTSTART;TZID=America/Edmonton:20261116T150000\r\nDTEND;TZID=America/Edmonton:20261116T160000\r\nSUMMARY:Moved meetup')
        data = build_feed(feed(raw), NOW)['events']
        self.assertEqual([x['startDay'] for x in data], ['2026-10-25', '2026-11-01', '2026-11-16'])
        self.assertTrue(data[0]['start'].endswith('-06:00'))
        self.assertTrue(data[1]['start'].endswith('-07:00'))
        self.assertEqual(data[2]['title'], 'Moved meetup')
    def test_midnight_end_and_public_field_allowlist(self):
        raw = event('night', 'DTSTART;TZID=America/Edmonton:20261010T220000\r\nDTEND;TZID=America/Edmonton:20261011T000000\r\nSUMMARY:Evening\r\nDESCRIPTION:<b>Hello</b><br>World\r\nATTENDEE:mailto:private@example.com')
        item = build_feed(feed(raw), NOW)['events'][0]
        self.assertEqual(item['endDay'], '2026-10-10')
        self.assertEqual(item['description'], 'Hello\nWorld')
        self.assertNotIn('private@example.com', str(item))
    def test_invalid_feed_fails(self):
        with self.assertRaises(ValueError):
            build_feed(b'<html>Error</html>', NOW)
if __name__ == '__main__':
    unittest.main()
