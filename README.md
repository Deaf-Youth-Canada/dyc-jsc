# DYC / JSC website

Complete bilingual static website, ready for GitHub Pages. All board images, memories photos, and bylaws reader pages are included. The public calendar updates automatically through GitHub Actions. See [EVENTS-GUIDE.md](EVENTS-GUIDE.md) for board-member instructions.

## Publish

1. Create a new public repository named `dyc-jsc` in the intended GitHub account.
2. Extract this ZIP and upload its contents to the repository root. `index.html` must be at the root, next to `assets`, `app.js`, and `style.css`. Upload the extracted files, not the ZIP.
3. In Settings → Pages, select **GitHub Actions**, then run **Sync public calendar and publish website** from the Actions tab.
4. Use the published URL shown in GitHub Pages settings. The repository is Deaf-Youth-Canada/dyc-jsc and the official website is https://dycjsc.ca/.

## Contact form

Messages still go through FormSubmit to info@dycjsc.ca. JavaScript sets the thank-you URL to the current host and folder, including custom domains. Without JavaScript, FormSubmit uses its default confirmation page. The first submission on a new host may require email activation. Confirm receipt after deployment; no test message was sent during preparation.

## Content and maintenance

- `index.html`: homepage and calendar layout.
- `about.html`: Who We Are, history, and mission.
- `board.html`, `bylaws.html`, `cdylc.html`, `memories.html`: board, inline bylaws reader, camp, and gallery.
- `get-involved.html`, `membership.html`, `contact.html`: participation pages.
- `terms.html`, `privacy.html`: bilingual policy pages.
- `app.js`: language switching, calendar, dropdowns, gallery, bylaws reader, and contact redirect.
- `style.css`: shared responsive styles.

Update both `data-en` and `data-fr` when changing translated copy. `mission.html` retains a legacy redirect; `resources.html` contains the external resource directory. The original Sites address remains live until a separate change is requested.

After publishing, check desktop and mobile navigation, English/French switching, all images, the bylaws reader, and contact delivery.

Photos, logos, and content retain their existing rights; this repository does not grant an open-source license to them.

