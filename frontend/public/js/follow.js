document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.follow-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const projectId = this.getAttribute('data-project-id');
            const isFollowed = this.textContent.trim() === 'Unfollow';

            // Display confirmation dialog before proceeding
            if (isFollowed && !confirm(`Are you sure you want to unfollow this project?`)) {
                return; // Do nothing if user cancels
            }

            const url = isFollowed ? `/project/${projectId}/unfollow` : `/project/${projectId}/follow`;

            try {
                const response = await fetch(url, { method: 'POST' });
                const result = await response.json();

                if (result.success) {
                    // Reload the page to reflect changes
                    location.reload();
                } else {
                    alert('An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    });
});
