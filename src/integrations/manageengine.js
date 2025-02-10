// ManageEngine ServiceDesk Plus integration
clockifyButton.render(
	'#WOHeader:not(.clockify), #WorkOrderDetailsTable_CT:not(.clockify), #ViewWO:not(.clockify)',
	{ observe: true },
	function (elem) {
		// prevent duplicate button inject
		if (elem.querySelector('.clockify-button-group')) return;

		// Hide default timer button
		const style = document.createElement('style');
		style.textContent = `
			[data-cs-field="worklog_timers"] {
				display: none !important;
			}

			/* Custom popup positioning and styling */
			.clockify-integration-popup {
				position: fixed !important;
				left:50% !important;
				top: 20% !important;
				width: 400px !important;
				z-index: 999999 !important;
				transform: translateX(-50%) scale(1.1) !important;
				transform-origin: center top !important;
			}

			.clockify-integration-popup .edit-form-description {
				height: 225px !important;
				min-height: 225px !important;
			}
		`;
		document.head.appendChild(style);

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

		// Add a debounce timer variable before the observer
		let observerTimer;
		let retryCount = 0;
		const MAX_RETRIES = 5;
		const RETRY_DELAYS = [100, 500, 1000, 2000, 3000]; // Increasing delays

		// Button inject handler with retry logic
		const injectButtons = () => {
			// Get parent container for button inject
			const parentContainer = document.querySelector('#actionsBar .btn-group')?.parentElement;
			if (!parentContainer || parentContainer.querySelector('.clockify-button-group')) {
				if (retryCount < MAX_RETRIES) {
					setTimeout(() => {
						retryCount++;
						injectButtons();
					}, RETRY_DELAYS[retryCount]);
					return;
				}
				return;
			}

			// Reset retry count on successful container find
			retryCount = 0;

			// Init search button component and inject it into the right wrapper
			const searchButton = document.createElement('button');
			searchButton.type = 'button';
			searchButton.className = 'btn btn-default btn-xs clockify-search-button';
			searchButton.style.cssText = 'margin: 10px !important; display: inline-block !important; float: right !important;';
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

			// Find the right wrapper and inject the search button
			const rightWrapper = document.querySelector('.right.pos-rel.p0[id^="wrapper_Request_"]');
			if (rightWrapper) {
				rightWrapper.appendChild(searchButton);
			}

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
					'Empty Template': `#${requestId}`,
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
					'Empty Template': `#${requestId}`,
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
				right: 0px !important;
			`;

			// Init timer button
			link = clockifyButton.createButton(defaultTimerDescription, 'Tickets to be Allocated');
			link.className = 'btn btn-xs btn-default';

			// Component order - moving everything into the buttonGroup
			dropdownGroup.appendChild(langButton);
			dropdownGroup.appendChild(dropdownButton);
			dropdownGroup.appendChild(dropdownMenu);
			inputGroup.appendChild(input);
			buttonGroup.appendChild(dropdownGroup);
			buttonGroup.appendChild(inputGroup);
			buttonGroup.appendChild(link);

			// Inject components into DOM
			parentContainer.appendChild(buttonGroup);
		};

		// Init mutation observer for dynamic content, needed because of SDP sometimes lazyloads stuff
		const contentObserver = new MutationObserver((mutations) => {
			clearTimeout(observerTimer);
			observerTimer = setTimeout(() => {
				// Check if buttons should be injected
				const shouldInject = !document.querySelector('.clockify-button-group') && 
								   document.querySelector('#WOHeader, #WorkOrderDetailsTable_CT, #ViewWO');
				if (shouldInject) {
					retryCount = 0; // Reset retry count for fresh injection attempt
					injectButtons();
				}

				// Handle ticket ID updates during lazyloading
				const newRequestId = document.querySelector('#request-id')?.textContent.match(/\d+/)?.[0] ||
								   document.querySelector('#reqid')?.textContent?.match(/\d+/)?.[0] ||
								   window.location.href.match(/woID=(\d+)/)?.[1];

				if (newRequestId && newRequestId !== requestId) {
					// Update search button with new ticket ID
					const searchButton = document.querySelector('.clockify-search-button');
					if (searchButton) {
						const startDate = new Date(new Date().getFullYear(), 0, 1);
						const endDate = new Date();
						
						searchButton.innerHTML = searchButton.innerHTML.replace(/#\d+ on Clockify/, `#${newRequestId} on Clockify`);
						searchButton.onclick = () => {
							const searchUrl = `https://oh22.clockify.me/reports/detailed?` + 
								`start=${startDate.toISOString()}&` +
								`end=${endDate.toISOString()}&` +
								`description=%23${newRequestId}&` +
								`page=1&pageSize=50`;
							window.open(searchUrl, '_blank');
						};
					}
				}
			}, 500); // increased debounce delay to 500ms
		});

		// Start observing DOM changes - always observe document.body
		const observeTarget = document.body;
		contentObserver.observe(observeTarget, {
			childList: true,
			subtree: true
		});

		// Function to handle initial injection with proper timing
		const initializeInjection = () => {
			// Reset retry count for fresh start
			retryCount = 0;
			
			// Try immediate injection
			injectButtons();

			// Schedule additional attempts with increasing delays
			RETRY_DELAYS.forEach((delay, index) => {
				setTimeout(() => {
					if (!document.querySelector('.clockify-button-group')) {
						retryCount = index;
						injectButtons();
					}
				}, delay);
			});
		};

		// Handle both immediate and deferred initialization
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', initializeInjection);
		} else {
			initializeInjection();
		}

		// Additional safety net for SPA navigation
		window.addEventListener('load', () => {
			if (!document.querySelector('.clockify-button-group')) {
				initializeInjection();
			}
		});
	}
);

