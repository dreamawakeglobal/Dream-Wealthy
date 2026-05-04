import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MonthlyReportDocument } from './MonthlyReportDocument';
import { Button } from './ui/Button';
import { Download, FileText } from 'lucide-react';
import { useSound } from '../SoundContext';

export const MonthlyReportGenerator = ({ variant = "secondary", style = {}, className = "" }) => {
    const reportRef = useRef(null);
    const { playPop } = useSound();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (playPop) playPop();
        setIsGenerating(true);
        
        try {
            const element = reportRef.current;
            if (!element) return;

            // Temporarily make it visible for rendering
            element.style.display = 'block';

            // Give the browser a moment to render the DOM changes
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, { 
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }
            
            const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
            pdf.save(`DreamWealthy_Report_${monthLabel}.pdf`);

            // Hide it again
            element.style.display = 'none';
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Button 
                onClick={handleDownload} 
                variant={variant} 
                size="sm" 
                style={style}
                className={className}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <FileText size={16} style={{ marginRight: '8px', animation: 'pulse 1.5s infinite' }} />
                ) : (
                    <Download size={16} style={{ marginRight: '8px' }} />
                )}
                {isGenerating ? 'Generating...' : 'Download Report'}
            </Button>

            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden' }}>
                <div style={{ display: 'none' }} ref={reportRef}>
                    <MonthlyReportDocument monthLabel={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} />
                </div>
            </div>
        </>
    );
};
