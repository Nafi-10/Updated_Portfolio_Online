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

## Export details

Source revision: 8838c4459a0b59bf8a4c06ef0fc1718c39154448
Public site: https://kazi-jawad-portfolio.kazihouse123.chatgpt.site/

Dependency folders, Git history, temporary previews, and machine-specific secrets
are not included. Install dependencies with npm install before using npm run dev.