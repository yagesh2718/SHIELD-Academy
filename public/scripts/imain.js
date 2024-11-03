const courseData = [
    { title: "Espionage Basics", level: "Beginner", price: "$50" },
    { title: "Advanced Combat Tactics", level: "Advanced", price: "$150" },
    { title: "Advanced power", level: "beginner", price: "$1050" }
];

const courseList = document.getElementById("courseList-v");

courseData.forEach(course => {
    const courseCard = document.createElement("div");
    courseCard.className = "course-card-v";
    
    courseCard.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Level:</strong> ${course.level}</p>
        <p><strong>Price:</strong> ${course.price}</p>
    `;

    courseList.appendChild(courseCard);
});





function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown-v');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Close dropdown if clicking outside of profile
document.addEventListener('click', function(event) {
    const profile = document.querySelector('.profilev-v');
    const dropdown = document.getElementById('profileDropdown-v');
    if (!profile.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});



