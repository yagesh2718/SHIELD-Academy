const courses = [
    {
        name: "Advanced Espionage Tactics",
        rating: "4.8 ★",
        enrollments: 300,
        revenue: "$4,500",
        price: "$200"
    },
    {
        name: "Combat Strategy and Defense",
        rating: "4.7 ★",
        enrollments: 220,
        revenue: "$3,200",
        price: "$75"
    }
];

function displayCourses() {
    const courseList = document.getElementById("course-list-v");
    courseList.innerHTML = ""; // Clear any existing content

    courses.forEach(course => {
        const courseCard = document.createElement("div");
        courseCard.classList.add("course-card-v");
        
        courseCard.innerHTML = `
            <h3>${course.name}</h3>
            <div class="course-info-v">
                <p><strong>Avg Rating:</strong> ${course.rating}</p>
                <p><strong>Enrollments:</strong> ${course.enrollments}</p>
                <p><strong>Revenue:</strong> ${course.price}</p>
                <p><strong>Revenue:</strong> ${course.revenue}</p>
                
            </div>
        `;
        
        courseList.appendChild(courseCard);
    });
}

document.addEventListener("DOMContentLoaded", displayCourses);
