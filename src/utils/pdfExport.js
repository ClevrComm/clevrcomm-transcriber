import { jsPDF } from 'jspdf';

export function generatePDF(analysisData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Helper to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
        if (yPos + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            return true;
        }
        return false;
    };

    // Helper to wrap text
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line, index) => {
            checkPageBreak();
            doc.text(line, x, y + (index * lineHeight));
            yPos = y + ((index + 1) * lineHeight);
        });
        return yPos;
    };

    // Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Conversation Analysis Report', margin, yPos);
    yPos += 15;

    // Timestamp
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 15;
    doc.setTextColor(0);

    // Summary Section
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Executive Summary', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    yPos = addWrappedText(analysisData.summary || 'No summary available.', margin, yPos, maxWidth);
    yPos += 10;

    // Sentiment Section
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Sentiment Analysis', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Overall Sentiment: ${analysisData.sentiment || 'Unknown'}`, margin + 5, yPos);
    yPos += 12;

    // Keywords Section
    if (analysisData.keywords && analysisData.keywords.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Keywords Detected', margin, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const keywordsText = analysisData.keywords.join(', ');
        yPos = addWrappedText(keywordsText, margin + 5, yPos, maxWidth - 5);
        yPos += 12;
    }

    // Scorecard Section
    if (analysisData.scorecard && analysisData.scorecard.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Scorecard Evaluation', margin, yPos);
        yPos += 10;

        analysisData.scorecard.forEach((item, index) => {
            checkPageBreak(25);

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${item.criteria}`, margin + 5, yPos);
            yPos += 6;

            doc.setFont(undefined, 'normal');
            doc.text(`Score: ${item.score}`, margin + 10, yPos);
            yPos += 6;

            yPos = addWrappedText(`Reasoning: ${item.reasoning}`, margin + 10, yPos, maxWidth - 15, 6);
            yPos += 8;
        });
    }

    // Transcript Section
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Transcript', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    if (typeof analysisData.transcript === 'string') {
        yPos = addWrappedText(analysisData.transcript, margin, yPos, maxWidth, 6);
    } else if (Array.isArray(analysisData.transcript)) {
        analysisData.transcript.forEach((entry) => {
            checkPageBreak(15);

            doc.setFont(undefined, 'bold');
            const header = `[${entry.time || '00:00'}] ${entry.speaker || 'Speaker'}:`;
            doc.text(header, margin, yPos);
            yPos += 5;

            doc.setFont(undefined, 'normal');
            yPos = addWrappedText(entry.text, margin + 5, yPos, maxWidth - 5, 5);
            yPos += 6;
        });
    }

    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // Save the PDF
    const filename = `Analysis_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
}
