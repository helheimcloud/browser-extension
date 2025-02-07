// On premise installation
clockifyButton.render(
	'.requestEditbrsty:not(.clockify)',
	{ observe: true },
	function (elem) {
		const description = $('#requestSubject_ID', elem).textContent;
		const project = 'Tickets to be Allocated';
		const ticketId = $('#requestId', elem).textContent;
		const clockifyCell = document.createElement('td');

		const link = clockifyButton.createButton(
			ticketId + ' : ' + description,
			project
		);

		clockifyCell.appendChild(link);

		$('td#startListMenuItems > table > tbody > tr').appendChild(clockifyCell);
	}
);

// Cloud version
clockifyButton.render(
	'#WorkOrderDetailsTable_CT:not(.clockify)',
	{ observe: true },
	function (elem) {
		const description = $('#details-middle-container h1', elem).textContent;
		const projectElem = $('#projectholder p') || {};
		const project = projectElem.textContent;
		const ticketId = $('#reqid', elem).textContent;
		const clockifyCell = document.createElement('li');

		const link = clockifyButton.createButton(
			ticketId + ': ' + description,
			project
		);

		clockifyCell.appendChild(link);

		$('#details-middle-container ul.reply-actions').appendChild(clockifyCell);
	}
);

// ManageEngine ServiceDesk Plus integration
clockifyButton.render(
	'[id^="timericon-request"]:not(.clockify)',
	{ observe: true },
	function (elem) {
		// Get the request ID from the timer icon div
		const requestId = elem.id.replace('timericon-request', '');
		
		// Find the request subject/description
		const description = document.querySelector('#req_subject')?.textContent || 
						  'No Description';


		// Create a button container similar to ManageEngine's style
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'btn-group';
		buttonContainer.style.marginLeft = '10px';

		// Create the Clockify button
		const link = clockifyButton.createButton(
			`${description} #${requestId}`
		);
		link.className = link.className + ' btn btn-xs btn-default';

		buttonContainer.appendChild(link);

		// Find the parent container and insert our button after the timer button
		const parentContainer = elem.closest('.btn-group').parentElement;
		if (parentContainer) {
			parentContainer.insertBefore(buttonContainer, elem.closest('.btn-group').nextSibling);
		}
	}
);
