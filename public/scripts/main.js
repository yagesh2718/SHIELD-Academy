// Sample data for courses
const courses = [
    { title: "Learn HTML, CSS & JavaScript", category: "combat", instructor: "John Doe", rating: 4.7, level: "beginner", price: "$49.99" },
    { title: "Intro to Graphic Design", category: "cyber", instructor: "Jane Smith", rating: 3.5, level: "advanced", price: "$39.99" },
    { title: "Data Structures & Algorithms", category: "weapons", instructor: "Alan Turing", rating: 4.8, level: "beginner", price: "$59.99" },
    { title: "Ethical Hacking Basics", category: "leadership", instructor: "Elliot Alderson", rating: 4.9, level: "beginner", price: "$89.99" },
    { title: "Video Editing Essentials", category: "medical", instructor: "Chris Doe", rating: 4.6, level: "advanced", price: "$29.99" },
    { title: "Social Media Strategies", category: "combat", instructor: "Kim Lee", rating: 4.3, level: "beginner", price: "$35.99" }
];

// Function to display courses
function displayCourses(filteredCourses) {
    const container = document.getElementById("courses-container-v");
    container.innerHTML = ""; // Clear existing courses
    
    if (filteredCourses.length === 0) {
        container.innerHTML = "<p>No courses found for this category.</p>";
        return;
    }

    filteredCourses.forEach(course => {
        const courseCard = document.createElement("div");
        courseCard.classList.add("course-card-v");
        courseCard.innerHTML = `
            <img src="https://via.placeholder.com/300x160" alt="${course.title} image" class="course-image-v">
            <div class="course-content-v">
                <div class="course-title-v">${course.title}</div>
                <div class="course-instructor-v">${course.instructor}</div>
                <div class="course-rating-v">${'⭐'.repeat(Math.round(course.rating))} ${course.rating}</div>
                <div class="course-level-v">${course.level}</div>
                <div class="course-price-v">${course.price}</div>
            </div>
        `;
        container.appendChild(courseCard);
    });
}

// Display all courses initially
displayCourses(courses);

// Add click event to each category button
document.querySelectorAll(".catv-v li").forEach(categoryBtn => {
    categoryBtn.addEventListener("click", (event) => {
        // Log to check if the click is working
        console.log("Category clicked:", categoryBtn.getAttribute("data-category"));
        
        const category = categoryBtn.getAttribute("data-category");
        const filteredCourses = category === "all" ? courses : courses.filter(course => course.category === category);
    
        // Log to see the filtered courses
        console.log("Filtered courses:", filteredCourses);
        displayCourses(filteredCourses);
    });
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








