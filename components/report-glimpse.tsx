import { EngineMeters, ShareBars, StatTile } from "@/components/dashboard/charts";

/**
 * A page of the report, on the marketing site.
 *
 * Built from the dashboard's own chart components rather than a screenshot or
 * a mock, so the preview cannot drift from the product — if the bars change in
 * the app, they change here.
 *
 * The numbers are an example and are labelled as one. It picks up the same
 * category the hero asks about, so the page reads as one story: the answer you
 * are missing from, then the report that measures it. The tracked brand is a
 * placeholder rather than a customer — real accounts are not public.
 */
const COMPETITORS = [
  { name: "Notion", share: 31 },
  { name: "Asana", share: 24 },
  { name: "Linear", share: 18 },
  { name: "ClickUp", share: 12 },
  { name: "Your brand", share: 6, you: true },
  { name: "Monday.com", share: 9 },
];

const ENGINES = [
  { name: "Perplexity", mentioned: true, score: 41 },
  { name: "ChatGPT", mentioned: false, score: 28 },
  { name: "Claude", mentioned: false, score: 22 },
  { name: "Gemini", mentioned: false, score: 17 },
];

const YOU = COMPETITORS.find((c) => c.you);

export function ReportGlimpse() {
  return (
    <section className="sfx-band sfx-glimpse" id="report-preview">
      <div className="sfx-wrap">
        <div className="sfx-head">
          <h2 className="sfx-h2">And the page you get back</h2>
          <p className="sfx-lede">
            The same question, measured. Who the assistants name instead of you,
            how far back you sit, and which engines have never heard of you.
          </p>
        </div>

        <div className="sfx-glimpse-frame sf-report">
          <div className="sfx-glimpse-bar">
            <span className="sfx-glimpse-brand">yourbrand.com</span>
            <span className="sfx-glimpse-cat">project management software</span>
            <span className="sfx-glimpse-tag">example report</span>
          </div>

          <div className="sfx-glimpse-body">
            <div className="sf-tiles sfx-glimpse-tiles">
              <StatTile
                label="Visibility score"
                value={21}
                sub="Barely visible"
              />
              <StatTile
                label="Share of voice"
                value={Math.round(YOU?.share ?? 0)}
                unit="%"
                sub="Rank #6 of 6"
              />
              <StatTile
                label="Engines naming you"
                value={1}
                unit=" / 4"
                sub="Strongest on Perplexity"
              />
              <StatTile
                label="Cited sources you own"
                value={1}
                unit=" / 7"
                sub="6 you're absent from"
              />
            </div>

            <div className="sfx-glimpse-grid">
              <section className="sf-panel">
                <div className="sf-panel-head">
                  <h3 className="sf-panel-t">Share of voice</h3>
                </div>
                <ShareBars competitors={COMPETITORS} youRow={YOU} />
              </section>

              <section className="sf-panel">
                <div className="sf-panel-head">
                  <h3 className="sf-panel-t">Visibility by engine</h3>
                </div>
                <EngineMeters engines={ENGINES} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
