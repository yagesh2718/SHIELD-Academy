

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown-v');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}


document.addEventListener('click', function(event) {
    const profile = document.querySelector('.profilev-v');
    const dropdown = document.getElementById('profileDropdown-v');
    if (!profile.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

function filterCourses(category) {
    const courses = document.querySelectorAll('.course-card-v');

    courses.forEach(course => {
        const courseCategory = course.getAttribute('data-category');

        if (category === 'all' || courseCategory === category) {
            course.style.display = 'block'; 
        } else {
            course.style.display = 'none'; 
        }
    });
}
function searchCourses() {
    const searchInput = document.getElementById('courseSearchInput').value.toLowerCase();
    const courseCards = document.querySelectorAll('.course-card-v');

    courseCards.forEach(card => {
        const title = card.getAttribute('data-title');
        const instructor = card.getAttribute('data-instructor');
        
        if (title.includes(searchInput) || instructor.includes(searchInput)) {
            card.style.display = ''; 
        } else {
            card.style.display = 'none'; 
        }
    });
}










