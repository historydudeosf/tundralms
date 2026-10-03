# Tundra Academy LMS

A Schoology-style learning management system in plain HTML, CSS and JavaScript. No build step and no dependencies.

## Run it

Open `index.html` in a browser, or host the folder with GitHub Pages
(Settings → Pages → Deploy from branch → `main` / root).

## First sign-in

On a fresh start the admin account is username `admin`, password `admin`.
Change it right away on the **Admin** page. Other seeded users have the password `welcome1`.

## Features

- Roles: admin, teacher, student, with sign-in and an animated school splash screen
- Courses with banner images, folders (nested, colored), publish/unpublish, links, pages
- Assignments and tests: multiple choice, true/false, multiple select, short answer, number and essay questions, each with its own point value
- Teachers can read every student's answers and add or subtract points per question
- Weighted grade categories and a gradebook
- Groups with admins, updates and resources
- Admin page for users (name, username, password), courses, groups, school name, logo and theme color

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup |
| `style.css` | Styles (light and dark themes) |
| `app.js` | All app logic and state |
| `assets/logo.jpg` | Default school logo |

## Important limitations

- **Data is stored in each visitor's browser (localStorage).** On GitHub Pages every person gets their own separate copy, so accounts you create are only visible on your own device. Sharing data between people needs a backend (for example Firebase or Supabase).
- **Passwords are stored as plain text.** This is a demo of sign-in screens, not real security. Do not use real passwords or store sensitive student data.
