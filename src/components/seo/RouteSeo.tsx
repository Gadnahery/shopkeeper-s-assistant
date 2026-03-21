import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAppUrl } from "@/lib/siteUrl";

type SeoConfig = {
  title: string;
  description: string;
  robots: string;
  canonicalPath: string;
  ogType?: "website" | "article";
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const INDEXABLE_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex, nofollow, noarchive";

function normalizePath(pathname: string) {
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function buildUrl(pathname: string) {
  const baseUrl = getAppUrl();
  const normalizedPath = normalizePath(pathname);
  return normalizedPath === "/" ? `${baseUrl}/` : `${baseUrl}${normalizedPath}`;
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function buildHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://wisecash.app/#organization",
        name: "WiseCash",
        url: "https://wisecash.app/",
        logo: "https://wisecash.app/icon-512.png",
      },
      {
        "@type": "WebSite",
        "@id": "https://wisecash.app/#website",
        url: "https://wisecash.app/",
        name: "WiseCash",
        publisher: {
          "@id": "https://wisecash.app/#organization",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://wisecash.app/#software",
        name: "WiseCash",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://wisecash.app/",
        description:
          "WiseCash helps businesses manage POS, inventory, sales, staff, reports, and daily operations in one app.",
        publisher: {
          "@id": "https://wisecash.app/#organization",
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://wisecash.app/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is WiseCash?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "WiseCash is business management software for shops and growing businesses. It combines POS, inventory management, sales tracking, reports, and staff tools in one web app.",
            },
          },
          {
            "@type": "Question",
            name: "Who should use WiseCash?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "WiseCash is built for shop owners, wholesalers, retailers, hardware stores, pharmacies, salons, and small businesses that need better sales and stock control.",
            },
          },
          {
            "@type": "Question",
            name: "Does WiseCash work on phones and laptops?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Yes. WiseCash works on phones, tablets, and laptops, and it can also be installed as a PWA app for easier daily use.",
            },
          },
          {
            "@type": "Question",
            name: "How much does WiseCash cost?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "WiseCash is currently open for use while worldwide billing is being prepared. Official global pricing will be announced later.",
            },
          },
        ],
      },
    ],
  };
}

function getSeoConfig(pathname: string): SeoConfig {
  const routePath = normalizePath(pathname);

  const publicPages: Record<string, SeoConfig> = {
    "/": {
      title: "WiseCash | POS, Inventory, Sales and Retail Management",
      description:
        "WiseCash helps shops and growing businesses worldwide manage POS, inventory, sales, reports, staff, and daily operations in one modern web app.",
      robots: INDEXABLE_ROBOTS,
      canonicalPath: "/",
      ogType: "website",
      jsonLd: buildHomeJsonLd(),
    },
    "/features": {
      title: "WiseCash Features | POS, Inventory and Business Tools",
      description:
        "Explore WiseCash features for checkout, barcode scanning, reports, stock control, customer records, and day-to-day shop operations.",
      robots: INDEXABLE_ROBOTS,
      canonicalPath: "/features",
      ogType: "website",
    },
    "/pricing": {
      title: "WiseCash Pricing | Global Launch Access",
      description:
        "Start using WiseCash now while global billing is being prepared. Official worldwide pricing and payment options will be announced later.",
      robots: INDEXABLE_ROBOTS,
      canonicalPath: "/pricing",
      ogType: "website",
    },
    "/about": {
      title: "About WiseCash | Retail Software for Modern Businesses",
      description:
        "Learn how WiseCash helps shops, wholesalers, and growing businesses run sales, stock, staff, and daily reporting from one reliable web app.",
      robots: INDEXABLE_ROBOTS,
      canonicalPath: "/about",
      ogType: "website",
    },
    "/contact": {
      title: "Contact WiseCash | Start a Trial or Get Setup Help",
      description:
        "Talk to WiseCash about onboarding, team training, and getting your shop set up with modern POS, stock, and reporting tools.",
      robots: INDEXABLE_ROBOTS,
      canonicalPath: "/contact",
      ogType: "website",
    },
  };

  if (publicPages[routePath]) {
    return publicPages[routePath];
  }

  return {
    title: "WiseCash",
    description:
      "WiseCash helps shops and growing businesses worldwide manage POS, inventory, sales, reports, staff, and daily operations in one modern web app.",
    robots: NOINDEX_ROBOTS,
    canonicalPath: routePath || "/",
    ogType: "website",
  };
}

export function RouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoConfig(location.pathname);
    const canonicalUrl = buildUrl(seo.canonicalPath);
    const structuredData = seo.jsonLd
      ? Array.isArray(seo.jsonLd)
        ? seo.jsonLd
        : seo.jsonLd
      : null;

    document.title = seo.title;
    document.documentElement.lang = "en";

    upsertMeta('meta[name="description"]', { name: "description", content: seo.description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: seo.robots });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: seo.description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: seo.ogType ?? "website" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: seo.description });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    const existingJsonLd = document.getElementById("route-seo-jsonld");
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    if (structuredData) {
      const script = document.createElement("script");
      script.id = "route-seo-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [location.pathname]);

  return null;
}
