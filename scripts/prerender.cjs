const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "../dist");
const indexHtmlPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexHtmlPath)) {
  console.error("Prerender error: dist/index.html does not exist. Run vite build first.");
  process.exit(1);
}

const template = fs.readFileSync(indexHtmlPath, "utf-8");

const routes = [
  {
    path: "/",
    title: "WiseCash | POS, Inventory, Sales and Retail Management",
    description:
      "WiseCash helps shops and growing businesses manage POS, inventory, sales, reports, staff, and daily operations in one modern web app.",
    canonical: "https://wisecash.app/",
  },
  {
    path: "/features",
    title: "WiseCash Features | POS, Inventory and Business Tools",
    description:
      "Explore WiseCash features for checkout, barcode scanning, reports, stock control, customer records, and day-to-day shop operations.",
    canonical: "https://wisecash.app/features",
  },
  {
    path: "/pricing",
    title: "WiseCash Pricing | TZS 25,000/Month All-Inclusive",
    description:
      "WiseCash costs TZS 25,000 per month with all features included. Pay easily with mobile money (M-Pesa, Halotel, Airtel Money, Tigo Pesa) — no card needed.",
    canonical: "https://wisecash.app/pricing",
  },
  {
    path: "/about",
    title: "About WiseCash | Retail Software for Modern Businesses",
    description:
      "Learn how WiseCash helps shops, wholesalers, and growing businesses run sales, stock, staff, and daily reporting from one reliable web app.",
    canonical: "https://wisecash.app/about",
  },
  {
    path: "/contact",
    title: "Contact WiseCash | Get Started or Request Setup Help",
    description:
      "Talk to WiseCash about onboarding, team training, and getting your shop set up with modern POS, stock, and reporting tools.",
    canonical: "https://wisecash.app/contact",
  },
];

function generateHtmlForRoute(route) {
  let html = template;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${route.title}</title>`);

  // Replace description meta
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace og:title
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:title" content="${route.title}" />`
  );

  // Replace og:description
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:description" content="${route.description}" />`
  );

  // Replace twitter:title
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:title" content="${route.title}" />`
  );

  // Replace twitter:description
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:description" content="${route.description}" />`
  );

  // Ensure canonical link exists or is replaced
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i,
      `<link rel="canonical" href="${route.canonical}" />`
    );
  } else {
    html = html.replace("</head>", `    <link rel="canonical" href="${route.canonical}" />\n  </head>`);
  }

  // Ensure og:url exists or is replaced
  if (html.includes('property="og:url"')) {
    html = html.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      `<meta property="og:url" content="${route.canonical}" />`
    );
  } else {
    html = html.replace("</head>", `    <meta property="og:url" content="${route.canonical}" />\n  </head>`);
  }

  return html;
}

routes.forEach((route) => {
  const content = generateHtmlForRoute(route);

  if (route.path === "/") {
    fs.writeFileSync(indexHtmlPath, content, "utf-8");
    console.log("Prerendered: / (dist/index.html)");
  } else {
    const slug = route.path.replace(/^\//, "");

    // Write dist/{slug}.html
    const flatFile = path.join(distDir, `${slug}.html`);
    fs.writeFileSync(flatFile, content, "utf-8");

    // Write dist/{slug}/index.html
    const nestedDir = path.join(distDir, slug);
    if (!fs.existsSync(nestedDir)) {
      fs.mkdirSync(nestedDir, { recursive: true });
    }
    fs.writeFileSync(path.join(nestedDir, "index.html"), content, "utf-8");

    console.log(`Prerendered: ${route.path} -> dist/${slug}.html & dist/${slug}/index.html`);
  }
});

console.log("Prerender completed successfully for all public marketing routes!");
