Layra static site
==================

Files:
- index.html
- book.html

book.html expects an external backend API for booking emails.
Find this line near the top of book.html and set it to your deployed URL:

  const API_BASE = 'https://YOUR-BACKEND-URL';

Then re-deploy.

---
Deploy free on Netlify (easiest):
1) Go to https://app.netlify.com/ and sign up.
2) Click "Add new site" > "Deploy manually".
3) Drag the folder (or zip) onto the drop area.
4) Test the site on the *.netlify.app URL Netlify gives you.
5) In Site settings > Domain management > Add custom domain: add your domain (e.g., lrconsulting.xyz).
6) Netlify will show the DNS records to add at GoDaddy. Copy them exactly.
7) At GoDaddy: Domain > DNS > Manage DNS > Add records shown by Netlify.
8) Wait for DNS to propagate (~15–60 min). Enable HTTPS in Netlify (auto).

