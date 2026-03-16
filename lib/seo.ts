import type { Metadata } from "next";

import { faqs, pricingPlans, siteConfig } from "@/lib/constants/site";
import { hostnames } from "@/lib/utils/host-routing";

type MetadataHost = "marketing" | "app" | "admin";

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  keywords: string[];
  path: string;
  host?: MetadataHost;
  index?: boolean;
  type?: "website" | "article";
};

export const metadataBaseUrl = new URL(`https://${hostnames.marketing}`);

export function getAbsoluteRouteUrl(path: string, host: MetadataHost = "marketing") {
  return `https://${hostnames[host]}${path}`;
}

export function buildPageMetadata({
  title,
  description,
  keywords,
  path,
  host = "marketing",
  index = true,
  type = "website",
}: BuildPageMetadataOptions): Metadata {
  const absoluteUrl = getAbsoluteRouteUrl(path, host);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: absoluteUrl,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      type,
      locale: "ro_RO",
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: index
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
  };
}

export function getHomepageOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: getAbsoluteRouteUrl("/"),
    sameAs: [siteConfig.youtubeUrl, siteConfig.discordUrl, siteConfig.xUrl],
    description: "Comunitate trading crypto România cu educație, semnale crypto și sesiuni live.",
  };
}

export function getHomepageFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getUpgradeOfferSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Abonament Elite Trading Crypto",
    description:
      "Abonament pentru comunitate trading crypto din România cu acces la Discord Elite, analize, sesiuni live și bibliotecă video.",
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: pricingPlans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace("$", ""),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: getAbsoluteRouteUrl("/upgrade", "app"),
      description: `${plan.name} - ${plan.details}`,
    })),
  };
}
