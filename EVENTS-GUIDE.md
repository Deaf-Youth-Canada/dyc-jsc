# Manage website events

1. Sign in to Google Calendar as **creative.director@dycjsc.ca**, or use a member account invited to edit the calendar.
2. Use the calendar owned by **creative.director@dycjsc.ca** (calendar ID `c_0189f173417acc31373d77ace1604040364cb4f7368513314d6154544244b7af@group.calendar.google.com`). The older calendar under dycjsc@gmail.com is retained as an archive and is no longer used by the website. Create an event and select **DYC/JSC Public Events** in the calendar field.
3. Add the title, dates, times, location and description, then save. All-day, multi-day and recurring events are supported.
4. The website checks on a schedule set for every 15 minutes. Google/GitHub may delay updates, sometimes substantially. Refresh the website after waiting.
5. **On the horizon** automatically shows up to four upcoming or ongoing events in date order. Timed events drop off when they end; all-day events stay through their final day in Mountain Time. Open pages check for expired events every 30 seconds and fetch the latest published event snapshot every five minutes, or when the visitor returns to the tab. New events still depend on the Google/GitHub sync described above.
6. Edit or delete the event in this same calendar to update or remove it from the website.

This calendar is public, including event details and potential search-engine visibility. Keep private board meetings and confidential notes in the original DYC-JSC calendar. Add guests only if you intend to invite them. Provide both English and French event text where appropriate; the website translates its controls, not event titles or descriptions.

Website event times use Mountain Time (Edmonton), including daylight saving. Today is bold red; event dates have red dots. Select a date to read event details. The **View live calendar** link opens Google's current calendar.

To give a board member editing access, go to Google Calendar → Settings → DYC/JSC Public Events → Shared with → Add people and groups → **Make changes to events**. Invite their own account; do not share passwords. 

## Website maintenance

The **Sync public calendar and publish website** GitHub Actions workflow runs on pushes, manual requests, and at minutes 7, 22, 37 and 52 each hour. It reads only the dedicated calendar's public iCal feed and saves selected event fields to `events.json`. No password, private calendar address, API key, guest list or organiser address is stored.

The snapshot covers the previous 366 days and next 731 days. It advances daily and whenever event data changes. Unchanged checks do not create commits or deploy. Daily snapshot commits maintain repository activity; GitHub can disable scheduled workflows after 60 days without repository activity.

A download or parsing failure preserves the last successful snapshot. After 48 hours without a new snapshot, visitors see an update-delay notice. A browser request failure shows an error rather than claiming there are no events. The live-calendar link remains available.

To refresh manually: GitHub → Actions → Sync public calendar and publish website → Run workflow. Re-enable the workflow there if disabled. Check failed runs if changes do not appear. Repeated calendar failures or changes to repository permissions require maintainer attention.

Pages source must be **GitHub Actions**. The workflow explicitly deploys because commits made by the built-in automation token do not trigger a branch-based Pages build. It needs contents-write permission to store public snapshots and Pages/id-token write permissions to deploy, using GitHub's temporary token. After an ownership transfer, verify Actions permissions, Pages, the custom domain and a successful scheduled run.

Local checks: `pip install -r scripts/requirements.txt`, `python -m unittest discover -s tests`, `python scripts/sync_calendar.py`, `node --check public-events.js`.


