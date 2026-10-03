# Tundra Academy LMS

A Schoology-style learning management system in one HTML file. No build step and no dependencies.
`index.html` is the whole app (it is the same file as `lms.html`). Edit it directly.

## Run it

Open `index.html` in a browser, or host it with GitHub Pages
(Settings → Pages → Deploy from branch → `main` / root).

## First sign-in

On a fresh start the admin account is username `admin`, password `admin`.
Change it right away on the **Admin** page. Other sample users have the password `welcome1`.

## Share accounts and data between computers (Supabase)

By default data is saved only in the browser you are using. To make every computer see the same
accounts, courses and grades:

1. Create a free project at https://supabase.com.
2. In **SQL Editor**, run:

   ```sql
   create table lms_docs (id text primary key, json text not null, ts bigint not null);
   alter table lms_docs enable row level security;
   create policy "open read" on lms_docs for select using (true);
   create policy "open insert" on lms_docs for insert with check (true);
   create policy "open update" on lms_docs for update using (true) with check (true);
   ```

3. In **Project Settings → API**, copy the Project URL and the `anon` public key.
4. Paste them into `CONFIG` near the top of `index.html` (`supabaseUrl` and `supabaseKey`).
5. Commit and push. Open the site on two computers and sign in with the same account on both.

## Google Drive: a copy of a file for every student

With this set up, a teacher clicks **Choose from Google Drive** when creating an assignment, picks a Google Doc,
Sheet or Slides file, and the app makes one copy per enrolled student and shares each copy with that student.
Students open their own copy and press **Turn in**. The teacher sees every student's copy on the assignment page.

You need your own Google Cloud project (free), and the site must be served from a real address such as GitHub Pages.

1. Go to https://console.cloud.google.com and create a project. Note its **project number** (this is `googleAppId`).
2. **APIs & Services → Library**: enable **Google Drive API** and **Google Picker API**.
3. **OAuth consent screen**: choose External, fill in the app name and your email, and add the scope
   `https://www.googleapis.com/auth/drive.file`. While the app is in Testing mode, add each teacher's Google
   account under **Test users**.
4. **Credentials → Create credentials → OAuth client ID → Web application.** Under *Authorized JavaScript origins* add
   your site, for example `https://YOURNAME.github.io` (no path). Copy the client ID (`googleClientId`).
5. **Credentials → Create credentials → API key.** Restrict it to the Picker API and to your website address.
   Copy it (`googleApiKey`).
6. Paste all three values into `CONFIG` in `index.html`, then commit and push.
7. In the **Admin** page, add each student's **Google email** so their copy can be shared with them.

Good to know:
- Copies live in the teacher's Google Drive and take up the teacher's storage. Students get edit access.
- Turning in does not lock the student's file.
- The app only asks for the `drive.file` permission, so it can only touch files the teacher picked and the copies it makes.
- This does not work inside Claude's hosted preview, only on your own website.

## Important limitations

- **Not secure.** With Supabase set up as above, anyone with the site address can read and write everything, including
  passwords (stored as plain text). Use it for demos and small trusted groups. Do not store sensitive student data or reuse real passwords.
- Without Supabase configured, data is per browser, so accounts will not follow people between computers.
