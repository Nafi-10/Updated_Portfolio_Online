# Kazi Jawad Portfolio

Complete project export with the latest public portfolio, 10 real gallery photos,
animated Gallery header, project article pages, and downloadable PDF CV.

## Run locally

1. Extract this ZIP.
2. Open a terminal in the Kazi-Jawad-Portfolio folder.
3. With Node.js and npm installed, run:

   npm install
   npm run dev

4. Open http://localhost:3000 in your browser.

You can also open the project folder in VS Code and use Live Server with index.html
for a static preview. Fonts and some existing animation libraries load from CDNs.

## Build the public website

   npm run build:public

The build/ folder already contains the latest ready-to-host static website.
Upload the contents of build/ to a static web host. The local server and admin
source are separate from this public build.

## Main files

- index.html: homepage
- gallery/index.html: complete Gallery page
- assets/img/gallery/: the 10 original gallery photos and manifest.json
- scripts/build-gallery.mjs: generates Gallery cards and homepage preview
- js/particles-config.js: shared homepage and Gallery particle animation
- articles/: project articles and source PDF documents
- assets/documents/MD_Kazi_Jawadul_Islam_CV.pdf: downloadable CV
- css/ and js/: page styles and behavior
- data/ and content/: portfolio content
- server.ts: local development server
- package.json and package-lock.json: dependencies and run commands

After changing the Gallery manifest or article data, run npm run build:public.

## Downloadable CV

`scripts/generate-cv.py` creates the two-page CV from the portfolio biography,
experience, education, and skills, with concise summaries of all six projects.
Run it with Python and ReportLab after updating the content, then run
`npm run build:public` to include the refreshed PDF. The generated file is saved
in `output/pdf/` and copied to `assets/documents/` for the Download CV button.
The About Me text is justified in both the website and the PDF.

## Articles & Projects folders

The homepage library has two animated glass folders. Six case studies live under
Projects, including Maison Velour, Hridita Portfolio, and 3D Building Blueprint.
Projects use numbered folded-paper cards with topic filters and carousel arrows.
Read more opens a web article; original-PDF callouts are omitted. Articles uses
the same cards and contains three detailed posts about AI, robotics, and prompting.
It also supports general-topic PDFs and reading notes.
The folder animation responds to hover and keyboard focus and respects reduced motion.

Project case studies are authored in `data/project-articles.json`. Each can include
three concise `highlights` and optional section screenshots with captions. The
building configurator screenshots use Kazi Jawad branding.

Blog posts are authored in `content/blog/*.md`, with card metadata and key
takeaways in `data/blog-articles.json`. `scripts/build-blog.mjs` generates the
reading pages, linked contents, tables, examples, and article navigation. Run
`npm run build:public` after editing them. Direct folder links use
`/?folder=articles#articles` or `/?folder=projects#articles`.

To add content, use the local admin's Articles & Projects Library editor, or edit
the `articles` array in `data/portfolio-data.json` and `content/data.json`:

- `collection`: `projects` or `articles`
- `title`, `category`, `excerpt`: card text and topic filter
- `pdf`: primary PDF path, such as `articles/documents/my-notes.pdf`
- `href`: optional Read more page
- `thumbnail`: optional cover image path
- `images`: list of `{ "src": "assets/img/projects/example.jpg", "alt": "Description" }`
- `documents`: optional list of `{ "url": "articles/documents/notes.pdf", "title": "Design notes" }`
- `body`: optional plain-text reading content when no Read more page is supplied

Copy the actual files into those project folders before building. Computer-only
paths such as `D:\\...` cannot be opened by public visitors. Local admin saves do
not publish the static website automatically; rebuild and redeploy to share changes.
The build preserves custom articles and projects while enriching case studies
with their available images and document metadata. Run `node --test scripts/library.test.mjs scripts/blog.test.mjs`
to verify that behavior.

## Export details

Source revision: b3bec9015160e0e1f23a96cc038db709560b8f04
Public site: https://kazi-jawad-portfolio.kazihouse123.chatgpt.site/

Dependency folders, Git history, temporary previews, and machine-specific secrets
are not included. Install dependencies with npm install before using npm run dev.
