import React, { useMemo } from 'react';
import { Button, Card, Typography } from 'antd';
import { useOutletContext } from 'react-router-dom';
import jsPDF from 'jspdf';
import type { MarketingCopy, MarketingLang } from './i18n';

type OutletCtx = { onRequestAudit: () => void; lang: MarketingLang; copy: MarketingCopy };

function flattenOffer(copy: MarketingCopy): string[] {
  const lines: string[] = [];
  lines.push(copy.offer.title);
  lines.push(copy.offer.subtitle);
  lines.push(copy.offer.brandLine);
  lines.push('');

  for (const s of copy.offer.sections) {
    lines.push(s.title);
    lines.push('');
    for (const part of s.body) {
      if (typeof part === 'string') {
        lines.push(part);
      } else {
        for (const b of part.bullets) lines.push(`• ${b}`);
      }
      lines.push('');
    }
    lines.push('');
  }

  if (copy.offer.strongPhraseTitle) lines.push(copy.offer.strongPhraseTitle);
  lines.push(copy.offer.strongPhrase);
  return lines;
}

function downloadOfferPdf(copy: MarketingCopy, lang: MarketingLang) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;

  const title = `${copy.offer.title}\n${copy.offer.subtitle}\n${copy.offer.brandLine}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(title, maxWidth);
  let y = margin;
  doc.text(titleLines, margin, y);
  y += titleLines.length * 18 + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const lines = flattenOffer(copy).slice(4); // skip repeated header
  const lineHeight = 16;

  for (const raw of lines) {
    const text = raw.trimEnd();
    if (text.length === 0) {
      y += lineHeight * 0.6;
      continue;
    }

    // Simple emphasis for section titles (starting with digit+dot) and last strong phrase title.
    const isSectionTitle = /^\d+\./.test(text) || text === copy.offer.strongPhraseTitle;
    if (isSectionTitle) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    const wrapped = doc.splitTextToSize(text, maxWidth);
    const blockHeight = wrapped.length * lineHeight;
    if (y + blockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(wrapped, margin, y);
    y += blockHeight;
  }

  const safe = lang === 'ru' ? 'RU' : 'EN';
  doc.save(`CMS_Commercial_Proposal_${safe}.pdf`);
}

export const CommercialOfferPage: React.FC = () => {
  const { copy, lang, onRequestAudit } = useOutletContext<OutletCtx>();

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
            <Button onClick={() => downloadOfferPdf(copy, lang)}>{copy.cta.downloadPdf}</Button>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-cards">
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

