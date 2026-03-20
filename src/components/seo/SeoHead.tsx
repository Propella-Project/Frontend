import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  buildJsonLdOrganization,
  buildJsonLdWebSite,
  DEFAULT_OG_IMAGE,
  getSeoForPath,
  SITE_NAME,
  SITE_URL,
} from "@/config/seo";

const THEME_COLOR = "#0F0F11";

/**
 * Route-aware document head: title, description, canonical, Open Graph, Twitter, JSON-LD.
 * Must render inside <BrowserRouter>.
 */
export function SeoHead() {
  const { pathname } = useLocation();
  const seo = getSeoForPath(pathname);

  const pathForUrl = pathname === "/" ? "" : pathname;
  const canonical = `${SITE_URL}${pathForUrl}`;

  const robots = seo.noindex
    ? "noindex, nofollow, noarchive"
    : (seo.robots ?? "index, follow");

  const isPublicIndexable = !seo.noindex;

  return (
    <Helmet htmlAttributes={{ lang: "en" }} prioritizeSeoTags>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords ? <meta name="keywords" content={seo.keywords} /> : null}
      <meta name="robots" content={robots} />
      <meta name="author" content={SITE_NAME} />
      <meta name="theme-color" content={THEME_COLOR} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:locale" content="en_NG" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      {isPublicIndexable ? (
        <script type="application/ld+json">
          {JSON.stringify(buildJsonLdOrganization())}
        </script>
      ) : null}
      {isPublicIndexable ? (
        <script type="application/ld+json">
          {JSON.stringify(buildJsonLdWebSite())}
        </script>
      ) : null}
    </Helmet>
  );
}
