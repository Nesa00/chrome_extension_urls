function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}

function randomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
	
function setupAutoRefresh(interval) {
    setTimeout(function() {
        location.reload(true);
    }, interval);
}

// Call the above function with desired interval. For example, 600000ms (10 minutes)
setupAutoRefresh(10000);

function getColorForPercentage(percentage) {
    const green = Math.min(255, Math.floor(255 - (255 * percentage / 100)));
    const red = Math.min(255, Math.floor(255 * percentage / 100));
    return `rgb(${red}, ${green}, 0)`;
}

function updateTimeoutColor() {
    chrome.storage.local.get(['urls', 'timeoutInMinutes'], function(result) {
        const urlListTbody = document.getElementById('url-list');
        const timeoutInMinutes = result.timeoutInMinutes * 60 * 1000;  // Convert to milliseconds
        const now = new Date().getTime();

        if (result.urls && result.urls.length > 0) {
            for (let i = 0; i < result.urls.length; i++) {
                const entry = result.urls[i];
                const timestamp = new Date(entry.timestamp).getTime();
                const elapsedTime = now - timestamp;
                const percentage = Math.min(100, (elapsedTime / timeoutInMinutes) * 100);
                const color = getColorForPercentage(percentage);

                //console.log('nowTime:', now);
                //console.log('dbTime:', timestamp);
                //console.log('elapsedTime:', elapsedTime);
                //console.log('percentage:', percentage);
                //console.log('color:', color);

                urlListTbody.rows[i].style.backgroundColor = color;
            }
        }
    });
}



function populateSelectOptions() {
    const daysSelect = document.getElementById('days');
    const hoursSelect = document.getElementById('hours');
    const minutesSelect = document.getElementById('minutes');

    for (let i = 0; i <= 30; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = i;
        daysSelect.appendChild(option);
    }

    for (let i = 0; i <= 23; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = i;
        hoursSelect.appendChild(option);
    }

    for (let i = 0; i <= 59; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = i;
        minutesSelect.appendChild(option);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const now = new Date(); // define 'now' here
    const urlListTbody = document.getElementById('url-list');
    const timeoutStatusDiv = document.getElementById('timeout-status');
    const saveTimeoutButton = document.getElementById('save-timeout');
    populateSelectOptions();

    chrome.storage.local.get(['urls', 'timeoutInMinutes'], function(result) {
        let tableRowsHtml = '';
        const timeoutInMinutes = result.timeoutInMinutes;
        
        if (timeoutInMinutes) {
            const days = Math.floor(timeoutInMinutes / (24 * 60));
            const hours = Math.floor((timeoutInMinutes % (24 * 60)) / 60);
            const minutes = timeoutInMinutes % 60;
            document.getElementById('days').value = days;
            document.getElementById('hours').value = hours;
            document.getElementById('minutes').value = minutes;
            timeoutStatusDiv.innerText = `Timeout: ${days}d ${hours}h ${minutes}m`;
        } else {
            timeoutStatusDiv.innerText = 'Timeout: Deactivated';
        }
		
        const timeoutInMillis = timeoutInMinutes * 60 * 1000;
        const now = new Date().getTime();

        if (result.urls && result.urls.length > 0) {
			let tableRowsHtml = '';
			let index = 0;
			for (let entry of result.urls) {
				const timestamp = entry.timestamp;
				const elapsedTime = now - timestamp;
				const percentage = Math.min(100, (elapsedTime / (timeoutInMinutes * 60 * 1000)) * 100);
				const color = getColorForPercentage(percentage);
					tableRowsHtml += `
						<tr style="background-color: ${color}">
							<td>
								<div class="checkbox checkbox-danger error-checkbox">
									<input id="checkbox-${index}" class="select-row" type="checkbox" data-url="${entry.url}">
									<label for="checkbox-${index}"></label>
								</div>
							</td>
							<td>${formatTimestamp(entry.timestamp)}</td>
							<td><a href="${entry.url}" class="preview" target="_blank">${entry.title || entry.url}</a></td>
						</tr>
					`;

					index++;
				}
            urlListTbody.innerHTML = tableRowsHtml;
        } else {
            urlListTbody.innerHTML = '<tr><td colspan="3">No URLs saved yet.</td></tr>';
        }
    });

    saveTimeoutButton.addEventListener('click', function() {
        const days = parseInt(document.getElementById('days').value);
        const hours = parseInt(document.getElementById('hours').value);
        const minutes = parseInt(document.getElementById('minutes').value);
        const timeoutInMinutes = days * 24 * 60 + hours * 60 + minutes;
        chrome.storage.local.set({ timeoutInMinutes }, function() {
            location.reload();
        });
    });
	updateTimeoutColor();
});


document.getElementById('batch-remove').addEventListener('click', function() {
	const selectedUrls = Array.from(document.querySelectorAll('.select-row:checked')).map(checkbox => checkbox.getAttribute('data-url'));

	if (selectedUrls.length === 0) {
		alert('No URLs selected for removal.');
		return;
	}

	const userConfirmed = confirm('Are you sure you want to remove the selected URLs?');
	if (userConfirmed) {
		const challengeString = randomString(5);
		const userInput = prompt(`Enter the following characters to confirm: ${challengeString}`);
		
		if (userInput === challengeString) {
			chrome.storage.local.get(['urls'], function(result) {
				const updatedUrls = result.urls.filter(entry => !selectedUrls.includes(entry.url));
				chrome.storage.local.set({ urls: updatedUrls }, function() {
					location.reload();
				});
			});
		} else {
			alert('Invalid input. Action canceled.');
		}
	}
});

document.getElementById('export-csv').addEventListener('click', function() {
	chrome.storage.local.get(['urls'], function(result) {
		let csvContent = 'data:text/csv;charset=utf-8,';
		csvContent += 'Web Page,Timestamp,URL\n';

		result.urls.forEach(entry => {
			csvContent += `"${entry.title || entry.url}","${formatTimestamp(entry.timestamp)}","${entry.url}"\n`;
		});

		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', 'urls.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
});

document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a.preview');
    const preview = document.getElementById('preview');
    const previewFrame = document.getElementById('previewFrame');

    links.forEach(link => {
        link.addEventListener('mouseover', function(event) {
            const href = this.getAttribute('href');
            previewFrame.src = href;
            preview.style.display = 'block';
            preview.style.top = event.clientY + 'px';
            preview.style.left = event.clientX + 'px';
        });

        link.addEventListener('mouseout', function() {
            preview.style.display = 'none';
            previewFrame.src = '';
			
			
        });
    });
});
document.getElementById('select-all').addEventListener('change', function(e) {
    console.log('Checkbox changed:', e.target.checked);
    const checked = e.target.checked;
    document.querySelectorAll('.select-row').forEach(function(checkbox) {
        checkbox.checked = checked;
    });
});
