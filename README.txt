
BRYCHI ENTERPRISES — FRONTEND v9/10

FILES
- index.html      Home
- about.html      About Us
- shop.html       Product catalogue
- cart.html       Cart + WhatsApp order UI
- shared.css      Shared responsive styling
- app.js          Product rendering, cart UI, search, WhatsApp flow

PRODUCT CATALOGUE
The Shop is intentionally a strict 2-column CSS grid on desktop/tablet:
    grid-template-columns: repeat(2, minmax(0, 1fr));

On small phones it becomes one column for readability.

The architecture is ready for ~100+ products because the shop does not create
100 hard-coded HTML cards. JavaScript renders cards from a product data source.

CLIENT PRODUCT UPLOAD
The client should eventually have an authenticated admin dashboard connected to
Firebase/Supabase Storage + database. That dashboard is NOT included in this
frontend-only stage. When connected, getProducts() in app.js should be replaced
with a database fetch and the renderer can remain the same.

IMAGE PLACEHOLDERS
Search the files for comments beginning with:
- OWNER PHOTO
- ABOUT PHOTO
- PRODUCT IMAGE
- FEATURE IMAGE
- TESTIMONIAL PHOTO
- PARTNERSHIP IMAGE

These mark exactly where real images can be inserted.

IMPORTANT
The current demo products use placeholder images and zero prices ("Price on request").
Replace these with the approved product information before publishing.
