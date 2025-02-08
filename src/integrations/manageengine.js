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
	'#WOHeader:not(.clockify), #WorkOrderDetailsTable_CT:not(.clockify), #ViewWO:not(.clockify)',
	{ observe: true },
	function (elem) {
		// prevent duplicate button inject
		if (elem.querySelector('.clockify-button-group')) return;

		// Extract ticket ID from page or URL
		const requestId = document.querySelector('#request-id')?.textContent.match(/\d+/)?.[0] ||
						 document.querySelector('#reqid')?.textContent?.match(/\d+/)?.[0] ||
						 window.location.href.match(/woID=(\d+)/)?.[1];  // fallback to URL as last resort
		if (!requestId) return;
		
		// Extract ticket metadata
		const description = document.querySelector('#req_subject')?.textContent || 
						   document.querySelector('.subject-text')?.textContent ||
						   'No Description';
		const requesterName = document.querySelector('#userName')?.textContent || 
							 document.querySelector('.requester-name')?.textContent ||
							 'Unknown Requester';
		
		// Init state variables
		let closeComment = document.querySelector('[data-name="closure_comments"] .asset-row')?.textContent || '';
		let currentLanguage = 'EN';
		let descriptionTemplates;
		let input;      // Input field reference
		let link;       // Timer button reference
		let dropdownButton; // Template selector reference

		// Init mutation observer for dynamic content, needed because of SDP sometimes lazyloads stuff
		// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
		const contentObserver = new MutationObserver((mutations) => {
			// Check if buttons should be injected
			const shouldInject = !document.querySelector('.clockify-button-group') && 
							   document.querySelector('#WOHeader, #WorkOrderDetailsTable_CT, #ViewWO');
			if (shouldInject) {
				injectButtons();
			}
		});

		// Start observing DOM changes
		contentObserver.observe(document.body, {
			childList: true,
			subtree: true
		});

		// Button inject handler
		const injectButtons = () => {
			// Get parent container for button inject
			const parentContainer = document.querySelector('#actionsBar .btn-group')?.parentElement;
			if (!parentContainer || parentContainer.querySelector('.clockify-button-group')) return;

			// Init search button component
			const createSearchButton = () => {
				const searchButton = document.createElement('button');
				searchButton.type = 'button';
				searchButton.className = 'btn btn-default btn-xs';
				searchButton.style.cssText = 'margin-left: 5px !important; order: 2 !important;';
				searchButton.innerHTML = `
					<svg viewBox="0 0 24 24" role="img" aria-label="Search" style="width: 16px; height: 16px; margin-right: 5px; vertical-align: text-bottom;">
						<g>
							<path style="fill:none;stroke:currentColor;stroke-miterlimit:10;stroke-width:1.6px" d="M10.58,2.82a8.18,8.18,0,0,1,8.25,8.1A8.18,8.18,0,0,1,10.58,19a8.18,8.18,0,0,1-8.24-8.11A8.17,8.17,0,0,1,10.58,2.82Z">
							</path>
							<line style="fill:none;stroke:currentColor;stroke-miterlimit:10;stroke-width:1.6px" x1="15.85" y1="16.41" x2="20.34" y2="20.82"></line>
						</g>
					</svg>
					#${requestId} on Clockify
				`;
				
				// Config date range for search
				const startDate = new Date(new Date().getFullYear(), 0, 1);
				const endDate = new Date();
				
				// Config search URL and click handler
				searchButton.onclick = () => {
					const searchUrl = `https://oh22.clockify.me/reports/detailed?` + 
						`start=${startDate.toISOString()}&` +
						`end=${endDate.toISOString()}&` +
						`description=%23${requestId}&` +
						`page=1&pageSize=50`;
					window.open(searchUrl, '_blank');
				};

				return searchButton;
			};

			// Templates for time entries
			const getTemplates = (comment) => ({
				EN: {
					'Inbound Email': `Received the request "${description}" from ${requesterName}. ${comment} #${requestId}`,
					'Inbound Call': `Received a call from ${requesterName} on the hotline. The user has the following request: "${description}". ${comment} #${requestId}`,
					'Suspected Phishing': `Suspected phishing report from ${requesterName}. Reviewed the email with the subject "${description}". ${comment} #${requestId}`,
					'Monitoring Alert': `Investigation of the monitoring alert: ${description}. ${comment} #${requestId}`,
					'Outbound Email Follow-up': `Sent follow-up to ${requesterName} regarding the request "${description}". ${comment} #${requestId}`,
					'Outbound Email Scheduling': `Reached out to ${requesterName} to schedule an appointment regarding the request "${description}". ${comment} #${requestId}`,
					'Outbound Call': `Reached out to ${requesterName} regarding the request "${description}". ${comment} #${requestId}`,
					'Vulnerability Mitigation': `Addressed vulnerability "${description}". ${comment} #${requestId}`,
					'Project Effort': `Work effort on Project "${description}". ${comment} #${requestId}`,
					'Empty Template': `${description} #${requestId}`,
					'Close Comment': `${comment} #${requestId}`
				},
				DE: {
					'Inbound Email (DE)': `Anfrage "${description}" von ${requesterName} erhalten. ${comment} #${requestId}`,
					'Inbound Call (DE)':  `Anruf von ${requesterName} auf der Hotline erhalten bezüglich folgender Anfrage: "${description}". ${comment} #${requestId}`,
					'Suspected Phishing (DE)': `Phishing-Verdachtsmeldung von ${requesterName}. E-Mail mit Betreff "${description}" überprüft. ${comment} #${requestId}`,
					'Monitoring Alert (DE)': `Untersuchung des Monitoring-Alarms: ${description}. ${comment} #${requestId}`,
					'Outbound Email Follow-up (DE)': `Follow-up an ${requesterName} bezüglich der Anfrage "${description}" gesendet. ${comment} #${requestId}`,
					'Outbound Email Scheduling (DE)': `Terminanfrage bezüglich der Anfrage "${description}" an ${requesterName} gesendet. ${comment} #${requestId}`,
					'Outbound Call (DE)': `${requesterName} bezüglich der Anfrage "${description}" telefonisch kontaktiert. ${comment} #${requestId}`,
					'Vulnerability Mitigation (DE)': `Schwachstelle "${description}" behoben. ${comment} #${requestId}`,
					'Project Effort (DE)': `Arbeitsaufwand am Projekt "${description}". ${comment} #${requestId}`,
					'Empty Template': `${description} #${requestId}`,
					'Close Comment': `${comment} #${requestId}`
				}
			});

			// Update handler for template/language changes
			const updateDescriptions = () => {
				// Sync closure comment
				closeComment = document.querySelector('[data-name="closure_comments"] .asset-row')?.textContent || closeComment;
				const templates = getTemplates(closeComment);
				descriptionTemplates = templates[currentLanguage];
				
				// Update description based on selected template
				const currentType = dropdownButton.innerHTML.replace(/ <em.*$/g, '');
				const newDescription = descriptionTemplates[currentType];

				// Update UI components with new description
				link.setAttribute('data-description', newDescription);
				const currentInputValue = input.value;
				const newInput = clockifyButton.createInput({
					description: newDescription,
					projectName: 'Tickets to be Allocated'
				});
				if (currentInputValue) {
					newInput.value = currentInputValue;
				}
				inputGroup.replaceChild(newInput, input);
				input = newInput;
			};

			// Template selection handler
			const createClickHandler = (type) => () => {
				dropdownButton.innerHTML = type + ' <em class="caret"></em>';
				updateDescriptions();
			};

			// Init template state
			const templates = getTemplates(closeComment);
			descriptionTemplates = templates[currentLanguage];
			const defaultType = currentLanguage === 'EN' ? 'Inbound Call' : 'Eingehender Anruf';
			const defaultDescription = descriptionTemplates[defaultType];
			const defaultTimerDescription = `${description} #${requestId}`;

			// Init language toggle
			const langButton = document.createElement('button');
			langButton.type = 'button';
			langButton.className = 'btn btn-default btn-xs';
			langButton.innerHTML = currentLanguage;
			langButton.onclick = () => {
				// Toggle language state
				currentLanguage = currentLanguage === 'EN' ? 'DE' : 'EN';
				langButton.innerHTML = currentLanguage;
				
				const templates = getTemplates(closeComment);
				descriptionTemplates = templates[currentLanguage];
				
				// Rebuild dropdown with new language
				dropdownMenu.innerHTML = '';
				Object.keys(descriptionTemplates).forEach(type => {
					const li = document.createElement('li');
					const a = document.createElement('a');
					a.href = 'javascript:void(0);';
					a.textContent = type;
					a.onclick = createClickHandler(type);
					li.appendChild(a);
					dropdownMenu.appendChild(li);
				});

				// Update template selection
				const currentType = dropdownButton.innerHTML.replace(/ <em.*$/g, '');
				const matchingType = Object.keys(descriptionTemplates).find(type => 
					type === (currentLanguage === 'EN' ? 
						Object.keys(templates.DE)[Object.keys(templates.EN).indexOf(currentType)] :
						Object.keys(templates.EN)[Object.keys(templates.DE).indexOf(currentType)]
					)
				) || Object.keys(descriptionTemplates)[0];
				
				dropdownButton.innerHTML = matchingType + ' <em class="caret"></em>';
				updateDescriptions();
			};

			// Init template dropdown
			const dropdownGroup = document.createElement('div');
			dropdownGroup.className = 'btn-group bs-noconflict mr10';

			dropdownButton = document.createElement('button');
			dropdownButton.type = 'button';
			dropdownButton.className = 'btn btn-default btn-xs sdmenu-toggle';
			dropdownButton.setAttribute('data-switch', 'sdmenu');
			dropdownButton.innerHTML = defaultType + ' <em class="caret"></em>';

			const dropdownMenu = document.createElement('ul');
			dropdownMenu.className = 'sdmenu-dd';
			dropdownMenu.style.width = '230px';

			// Populate dropdown options
			Object.keys(descriptionTemplates).forEach(type => {
				const li = document.createElement('li');
				const a = document.createElement('a');
				a.href = 'javascript:void(0);';
				a.textContent = type;
				a.onclick = createClickHandler(type);
				li.appendChild(a);
				dropdownMenu.appendChild(li);
			});

			// Init input field
			const inputGroup = document.createElement('div');
			inputGroup.className = 'btn-group bs-noconflict mr10';
			input = clockifyButton.createInput({
				description: defaultDescription,
				projectName: 'Tickets to be Allocated'
			});

			// Init button container
			const buttonGroup = document.createElement('div');
			buttonGroup.className = 'btn-group bs-noconflict mr10 clockify-button-group';
			buttonGroup.style.cssText = `
				display: inline-block !important;
				justify-content: flex-end !important;
				position: absolute !important;
				right: 20px !important;
			`;

			// Init timer button
			link = clockifyButton.createButton(defaultTimerDescription, 'Tickets to be Allocated');
			link.className = 'btn btn-xs btn-default';

			// Init search button
			const searchButton = createSearchButton();

			// Component order
			dropdownGroup.appendChild(langButton);
			dropdownGroup.appendChild(dropdownButton);
			dropdownGroup.appendChild(dropdownMenu);
			buttonGroup.appendChild(link);
			buttonGroup.appendChild(searchButton);
			inputGroup.appendChild(input);

			// Inject components into DOM
			parentContainer.appendChild(dropdownGroup);
			parentContainer.appendChild(inputGroup);
			parentContainer.appendChild(buttonGroup);
		};

		// Init button inject
		injectButtons();
	}
);

