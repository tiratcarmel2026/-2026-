import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { Transcript } from "@/lib/types";
import { formatTimestampShort, speakerDisplayName } from "@/lib/transcription/format";

export async function buildDocx(
  transcript: Transcript,
  speakerNames: Record<string, string>,
  originalFilename: string
): Promise<Buffer> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [new TextRun({ text: `תמלול: ${originalFilename}`, rightToLeft: true })],
    }),
  ];

  for (const segment of transcript.segments) {
    const name = speakerDisplayName(segment.speaker, speakerNames, transcript.speakers);
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 160 },
        children: [
          new TextRun({
            text: `[${formatTimestampShort(segment.start)}] ${name}: `,
            bold: true,
            rightToLeft: true,
          }),
          new TextRun({ text: segment.text, rightToLeft: true }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  return Packer.toBuffer(doc);
}
