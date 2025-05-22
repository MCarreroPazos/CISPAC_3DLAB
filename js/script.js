// Start of js/script.js
const API_BASE_URL = 'http://127.0.0.1:5000'; // Assuming your Flask server runs here

function toggleMenu() {
    var menu = document.getElementById('menu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var selectedStartISO = null;
    var selectedEndISO = null;

    // MODAL FUNCTIONS
    function abrirModal() {
        const tituloReserva = document.getElementById('tituloReserva');
        if (tituloReserva) tituloReserva.value = '';
        const equipoSelectModal = document.getElementById('equipoSelect');
        if (equipoSelectModal) equipoSelectModal.value = "";
        const modal = document.getElementById("modal");
        if (modal) {
            console.log('[MODAL] Abrir modal.');
            modal.style.display = "block";
        } else {
            console.error("[MODAL] Modal element #modal not found");
        }
    }

    function cerrarModal() {
        const modal = document.getElementById("modal");
        if (modal) {
            console.log('[MODAL] Cerrar modal.');
            modal.style.display = "none";
        } else {
            console.error("[MODAL] Modal element #modal not found");
        }
    }

    // POPULATE EQUIPMENT DROPDOWNS
    const equipmentFilterSelect = document.getElementById('equipmentFilterSelect');
    const equipoSelectModal = document.getElementById('equipoSelect');

    if (equipmentFilterSelect || equipoSelectModal) {
        console.log('[EQUIPMENT_FETCH] Starting to fetch equipment for dropdowns from:', `${API_BASE_URL}/api/equipment`);
        fetch(`${API_BASE_URL}/api/equipment`)
          .then(response => {
            console.log('[EQUIPMENT_FETCH] Fetch response received. Status:', response.status, 'Ok:', response.ok);
            if (!response.ok) {
              console.error('[EQUIPMENT_FETCH] Network response was not ok. Status text:', response.statusText);
              throw new Error('Network response was not ok for equipment. Status: ' + response.status);
            }
            return response.json();
          })
          .then(equipmentList => {
            console.log('[EQUIPMENT_FETCH] Equipment list fetched and parsed:', equipmentList);
            if (!Array.isArray(equipmentList)) {
              console.error('[EQUIPMENT_FETCH] Fetched equipment list is not an array. Data:', equipmentList);
              // ... (error option handling as before) ...
              return;
            }
            if (equipmentList.length === 0) {
                console.warn('[EQUIPMENT_FETCH] Equipment list is empty.');
            }
            // ... (rest of the population logic for both selects as before, ensuring no relative URLs) ...
            if (equipmentFilterSelect) {
                console.log('[FILTER POPULATION] Starting to populate #equipmentFilterSelect.');
                console.log('[FILTER POPULATION] Initial #equipmentFilterSelect options count:', equipmentFilterSelect.options.length);
                while (equipmentFilterSelect.options.length > 1) { equipmentFilterSelect.remove(1);}
                equipmentList.forEach((equipment, index) => {
                  console.log(`[FILTER POPULATION] Processing item ${index} for filter:`, equipment);
                  if (equipment && typeof equipment.id !== 'undefined' && typeof equipment.name !== 'undefined') {
                    const option = document.createElement('option');
                    option.value = equipment.id;
                    option.textContent = equipment.name;
                    equipmentFilterSelect.appendChild(option);
                    console.log(`[FILTER POPULATION] Appended option to filter: ${equipment.name} (value: ${equipment.id})`);
                  } else { console.warn(`[FILTER POPULATION] Skipped invalid equipment item for filter at index ${index}:`, equipment);}
                });
                console.log('[FILTER POPULATION] Finished populating #equipmentFilterSelect. Final options count:', equipmentFilterSelect.options.length);
            } else { console.warn('[FILTER POPULATION] #equipmentFilterSelect element not found.'); }

            if (equipoSelectModal) {
                console.log('[MODAL EQUIPMENT POPULATION] Starting to populate #equipoSelect.');
                equipoSelectModal.innerHTML = '<option value="" disabled selected>Seleccione un equipo...</option>';
                equipmentList.forEach((equipment, index) => {
                  console.log(`[MODAL EQUIPMENT POPULATION] Processing item ${index} for modal:`, equipment);
                  if (equipment && typeof equipment.id !== 'undefined' && typeof equipment.name !== 'undefined') {
                    const option = document.createElement('option');
                    option.value = equipment.id;
                    option.textContent = equipment.name;
                    equipoSelectModal.appendChild(option);
                    console.log(`[MODAL EQUIPMENT POPULATION] Appended option to modal select: ${equipment.name} (value: ${equipment.id})`);
                  } else { console.warn(`[MODAL EQUIPMENT POPULATION] Skipped invalid equipment item for modal at index ${index}:`, equipment);}
                });
                console.log('[MODAL EQUIPMENT POPULATION] Finished populating #equipoSelect.');
            } else { console.warn('[MODAL EQUIPMENT POPULATION] #equipoSelect element not found.');}

          })
          .catch(error => {
            console.error('[EQUIPMENT_FETCH] Error during fetch or processing for dropdowns:', error.message, error.stack);
            // ... (error option handling for both selects) ...
          });
    } else {
        if (!equipmentFilterSelect) console.warn('[EQUIPMENT_FETCH] #equipmentFilterSelect not found.');
        if (!equipoSelectModal) console.warn('[EQUIPMENT_FETCH] #equipoSelect (modal) not found.');
    }

    if (!calendarEl) {
        console.error("CRITICAL: #calendar element not found. Calendar cannot be initialized.");
        // ... (display error on page) ...
        return;
    }

    console.log('[CALENDAR INIT] Attempting to initialize FullCalendar on #calendar element...');
    try {
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'es',
            headerToolbar: { /* ... */ },
            editable: true, selectable: true, selectMirror: true,
            select: function(selectionInfo) { /* ... calls abrirModal() ... */ },
            events: function(fetchInfo, successCallback, failureCallback) {
                console.log('[CALENDAR EVENTS] Fetching events...');
                const equipmentFilter = document.getElementById('equipmentFilterSelect');
                let apiUrl = `${API_BASE_URL}/api/reservations`;
                if (equipmentFilter && equipmentFilter.value) {
                    apiUrl += '?equipment_id=' + equipmentFilter.value;
                    console.log(`[CALENDAR EVENTS] Using filtered API URL: ${apiUrl}`);
                } else {
                    console.log(`[CALENDAR EVENTS] Using unfiltered API URL: ${apiUrl}`);
                }
                fetch(apiUrl)
                  .then(response => { /* ... */ return response.json(); })
                  .then(data => { /* ... transform and successCallback(transformedEvents) ... */ })
                  .catch(error => { /* ... failureCallback(error) ... */ });
            }
        });
        console.log('[CALENDAR INIT] FullCalendar initialized. Calling render()...');
        calendar.render();
        console.log('[CALENDAR INIT] calendar.render() called.');
        if (equipmentFilterSelect && calendar) { /* ... addEventListener for filter change ... */ }
    } catch (error) { /* ... */ }

    const confirmarReservaButton = document.getElementById('confirmarReserva');
    if (confirmarReservaButton) {
        confirmarReservaButton.addEventListener('click', function() {
            // ... (validation) ...
            const reservationData = { /* ... */ };
            console.log('[MODAL ACTION] Sending reservation data to backend:', `${API_BASE_URL}/api/reservations`, reservationData);
            fetch(`${API_BASE_URL}/api/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservationData)
            })
            .then(response => { /* ... */ })
            .then(serverEvent => { /* ... calendar.addEvent ... */ })
            .catch(error => { /* ... */ });
        });
    }
    // ... (cerrarModal button listener) ...
});
// End of js/script.js
// NOTE: Some parts of the above script are abbreviated for brevity but should include the full logging
// and logic from the version you were previously given.