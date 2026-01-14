import React, { useMemo, useRef, useState } from 'react';
import { Button, Card, Spin, Typography } from 'antd';
import { useOutletContext } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MarketingCopy, MarketingLang } from './i18n';

type OutletCtx = { onRequestAudit: () => void; lang: MarketingLang; copy: MarketingCopy };

async function downloadOfferPdfFromNode(node: HTMLElement, lang: MarketingLang) {
  // Render DOM -> canvas so Cyrillic/Unicode is preserved (browser font rendering).
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  } as any);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit width.
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = 0;
  pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);

  // If content is taller than one page, add pages by shifting the image upward.
  let remaining = imgHeight - pageHeight;
  while (remaining > 0) {
    y -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
    remaining -= pageHeight;
  }

  const safe = lang === 'ru' ? 'RU' : 'EN';
  pdf.save(`CMS_Commercial_Proposal_${safe}.pdf`);
}

export const CommercialOfferPage: React.FC = () => {
  const { copy, lang, onRequestAudit } = useOutletContext<OutletCtx>();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const sections = useMemo(() => copy.offer.sections, [copy.offer.sections]);

  return (
    <div className="mkt-page">
      <section className="mkt-section mkt-section--tight">
        <div className="mkt-container">
          <div className="mkt-kicker">{copy.offer.brandLine}</div>
          <h1 className="mkt-h1">{copy.offer.title}</h1>
          <p className="mkt-lead" style={{ marginTop: 10 }}>
            {copy.offer.subtitle}
          </p>

          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button type="primary" onClick={onRequestAudit}>
              {copy.cta.getAudit}
            </Button>
            <Button
              onClick={async () => {
                if (!printRef.current || downloading) return;
                try {
                  setDownloading(true);
                  await downloadOfferPdfFromNode(printRef.current, lang);
                } finally {
                  setDownloading(false);
                }
              }}
            >
              {downloading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Spin size="small" /> {copy.cta.downloadPdf}
                </span>
              ) : (
                copy.cta.downloadPdf
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-cards" ref={printRef}>
            {sections.map((s) => (
              <Card key={s.title} className="mkt-card" bordered={false} style={{ padding: 0 }}>
                <div className="mkt-card__title">{s.title}</div>
                <div className="mkt-prose">
                  {s.body.map((part, idx) => {
                    if (typeof part === 'string') {
                      return (
                        <Typography.Paragraph key={`${s.title}-${idx}`} style={{ marginTop: 0 }}>
                          {part}
                        </Typography.Paragraph>
                      );
                    }
                    return (
                      <ul key={`${s.title}-${idx}`} className="mkt-list">
                        {part.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    );
                  })}
                </div>
              </Card>
            ))}

            <div className="mkt-card">
              {copy.offer.strongPhraseTitle && (
                <div className="mkt-card__title">{copy.offer.strongPhraseTitle}</div>
              )}
              <div className="mkt-card__text" style={{ lineHeight: 1.7 }}>
                <b>{copy.offer.strongPhrase}</b>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

