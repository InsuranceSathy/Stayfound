import { AnswerHero } from "@/components/answer-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeSections } from "@/components/home-sections";
import { VisibilityCheck } from "@/components/visibility-check";

/**
 * The homepage, in the NF design (ported from the approved /design lab):
 * drawing-sheet hero with the halftone parrot, one continuous ruled shell of
 * sections, the real check inside the framed cut-out, a dark closing band.
 *
 * The check is the live VisibilityCheck component — real scans, results,
 * paywall — re-skinned by the .nf overrides in app/nf.css.
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <AnswerHero />
      <HomeSections check={<VisibilityCheck />} />
      <SiteFooter />
    </>
  );
}
