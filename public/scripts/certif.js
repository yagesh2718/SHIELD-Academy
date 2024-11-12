// Import jsPDF as a global script
document.getElementById('download-btn-v').addEventListener('click', () => {
    const { jsPDF } = window.jspdf; // Access jsPDF from the global `window.jspdf`

    // Create a new jsPDF instance
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Set general styling
    pdf.setFont('Times', 'normal');
    pdf.setTextColor(0, 0, 128); // Dark blue color for text

    // Shield Academy Logo Placeholder (you can replace with actual image if you have one)
    pdf.setFontSize(20);
    pdf.text('Shield Academy', 105, 30, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text('Official Certificate of Completion', 105, 40, { align: 'center' });

    // Title
    pdf.setFontSize(24);
    pdf.text('Certificate of Achievement', 105, 70, { align: 'center' });

    // Student's Name
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0); // Black for main text
    pdf.text(`This certificate is proudly presented to`, 105, 90, { align: 'center' });

    // Student name placeholder
    const studentName = 'Jane Doe';  // Replace with actual student data if needed
    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 153);  // Dark blue for name
    pdf.text(studentName, 105, 105, { align: 'center' });

    // Course information
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.text(`for successfully completing the`, 105, 125, { align: 'center' });

    const courseName = 'Advanced Spy Tactics';  // Replace with actual course name if needed
    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 153);  // Dark blue for course name
    pdf.text(courseName, 105, 140, { align: 'center' });

    // Certificate description
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100); // Gray for description text
    pdf.text(
        'We commend your dedication and excellence in achieving this milestone.',
        105, 160,
        { align: 'center' }
    );

    // Date and Signature
    pdf.setFontSize(12);
    const issueDate = new Date().toLocaleDateString(); // Set current date
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.text(`Date: ${issueDate}`, 105, 180, { align: 'center' });

    pdf.setFontSize(14);
    pdf.text('Director Nick Fury', 105, 200, { align: 'center' });

    // Save the PDF
    pdf.save("Shield_Academy_Certificate.pdf");
});
