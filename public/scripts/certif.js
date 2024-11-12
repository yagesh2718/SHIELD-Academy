
document.getElementById('download-btn-v').addEventListener('click', () => {
    const { jsPDF } = window.jspdf; 

    
    const pdf = new jsPDF('p', 'mm', 'a4');

    
    pdf.setFont('Times', 'normal');
    pdf.setTextColor(0, 0, 128); 

   
    pdf.setFontSize(20);
    pdf.text('Shield Academy', 105, 30, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text('Official Certificate of Completion', 105, 40, { align: 'center' });

   
    pdf.setFontSize(24);
    pdf.text('Certificate of Achievement', 105, 70, { align: 'center' });

    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0); 
    pdf.text(`This certificate is proudly presented to`, 105, 90, { align: 'center' });

    // Student name placeholder
    const studentName = 'Jane Doe';  
    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 153);  
    pdf.text(studentName, 105, 105, { align: 'center' });

   
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0); 
    pdf.text(`for successfully completing the`, 105, 125, { align: 'center' });

    const courseName = 'Advanced Spy Tactics';  
    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 153);  
    pdf.text(courseName, 105, 140, { align: 'center' });

    
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100); 
    pdf.text(
        'We commend your dedication and excellence in achieving this milestone.',
        105, 160,
        { align: 'center' }
    );

    
    pdf.setFontSize(12);
    const issueDate = new Date().toLocaleDateString(); 
    pdf.setTextColor(0, 0, 0); 
    pdf.text(`Date: ${issueDate}`, 105, 180, { align: 'center' });

    pdf.setFontSize(14);
    pdf.text('Director Nick Fury', 105, 200, { align: 'center' });

    
    pdf.save("Shield_Academy_Certificate.pdf");
});
