// Start of js/script.js

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
        if (equipoSelectModal) equipoSelectModal.value = ""; // Reset to placeholder

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
        console.log('[EQUIPMENT_FETCH] Starting to fetch equipment for dropdowns.');
        fetch('/api/equipment')
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
              if(equipmentFilterSelect) {
                const errorFilterOption = document.createElement('option');
                errorFilterOption.textContent = 'Error: Invalid data';
                errorFilterOption.disabled = true;
                equipmentFilterSelect.appendChild(errorFilterOption);
              }
              if(equipoSelectModal) {
                const errorModalOption = document.createElement('option');
                errorModalOption.textContent = 'Error: Invalid data';
                errorModalOption.disabled = true;
                equipoSelectModal.appendChild(errorModalOption);
              }
              return;
            }
            
            if (equipmentList.length === 0) {
                console.warn('[EQUIPMENT_FETCH] Equipment list is empty. No new options will be added to dropdowns.');
            }

            if (equipmentFilterSelect) {
                console.log('[FILTER POPULATION] Starting to populate #equipmentFilterSelect.');
                console.log('[FILTER POPULATION] Initial #equipmentFilterSelect options count:', equipmentFilterSelect.options.length);
                while (equipmentFilterSelect.options.length > 1) {
                    equipmentFilterSelect.remove(1);
                }
                equipmentList.forEach((equipment, index) => {
                  console.log(`[FILTER POPULATION] Processing item ${index} for filter:`, equipment);
                  if (equipment && typeof equipment.id !== 'undefined' && typeof equipment.name !== 'undefined') {
                    const option = document.createElement('option');
                    option.value = equipment.id;
                    option.textContent = equipment.name;
                    equipmentFilterSelect.appendChild(option);
                    console.log(`[FILTER POPULATION] Appended option to filter: ${equipment.name} (value: ${equipment.id})`);
                  } else {
                    console.warn(`[FILTER POPULATION] Skipped invalid equipment item for filter at index ${index}:`, equipment);
                  }
                });
                console.log('[FILTER POPULATION] Finished populating #equipmentFilterSelect. Final options count:', equipmentFilterSelect.options.length);
            } else {
                // This was previously an error, but it's possible the element doesn't exist if the page is different
                console.warn('[FILTER POPULATION] #equipmentFilterSelect element not found in DOM. Skipping population.');
            }

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
                  } else {
                    console.warn(`[MODAL EQUIPMENT POPULATION] Skipped invalid equipment item for modal at index ${index}:`, equipment);
                  }
                });
                console.log('[MODAL EQUIPMENT POPULATION] Finished populating #equipoSelect.');
            } else {
                 // This was previously an error, but it's possible the element doesn't exist
                console.warn('[MODAL EQUIPMENT POPULATION] #equipoSelect element not found in DOM for modal. Skipping population.');
            }
          })
          .catch(error => {
            console.error('[EQUIPMENT_FETCH] Error during fetch or processing for dropdowns:', error.message, error.stack);
            if (equipmentFilterSelect) {
                const errorOption = document.createElement('option');
                errorOption.textContent = 'Error al cargar equipos';
                errorOption.disabled = true;
                equipmentFilterSelect.appendChild(errorOption);
            }
            if (equipoSelectModal) {
                const errorOption = document.createElement('option');
                errorOption.textContent = 'Error al cargar equipos';
                errorOption.disabled = true;
                equipoSelectModal.appendChild(errorOption);
            }
          });
    } else {
        if (!equipmentFilterSelect) console.warn('[EQUIPMENT_FETCH] #equipmentFilterSelect not found, skipping its population.');
        if (!equipoSelectModal) console.warn('[EQUIPMENT_FETCH] #equipoSelect (modal) not found, skipping its population.');
    }

    if (!calendarEl) {
        console.error("CRITICAL: #calendar element not found. Calendar cannot be initialized.");
        if (document.body) {
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = "<h1 style='color:red;'>Critical Error: Calendar container div (#calendar) not found.</h1>";
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }
        return; 
    }

    console.log('[CALENDAR INIT] Attempting to initialize FullCalendar on #calendar element...');
    try {
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            selectable: true,
            selectMirror: true,

            select: function(selectionInfo) {
                console.log('[CALENDAR EVENT] `select` callback triggered:', selectionInfo);
                selectedStartISO = selectionInfo.startStr;
                selectedEndISO = selectionInfo.endStr;
                abrirModal();
            },

            events: function(fetchInfo, successCallback, failureCallback) {
                console.log('[CALENDAR EVENTS] Fetching events...');
                const equipmentFilter = document.getElementById('equipmentFilterSelect');
                let apiUrl = '/api/reservations';
                if (equipmentFilter && equipmentFilter.value) {
                    apiUrl += '?equipment_id=' + equipmentFilter.value;
                    console.log(`[CALENDAR EVENTS] Using filtered API URL: ${apiUrl}`);
                } else {
                    console.log(`[CALENDAR EVENTS] Using unfiltered API URL: ${apiUrl}`);
                }
                
                fetch(apiUrl)
                  .then(response => {
                    console.log('[CALENDAR EVENTS] Fetch response status:', response.status, 'Ok:', response.ok);
                    if (!response.ok) {
                      console.error('[CALENDAR EVENTS] Network error fetching reservations. Status:', response.statusText);
                      throw new Error('Network error fetching reservations: ' + response.statusText);
                    }
                    return response.json();
                  })
                  .then(data => {
                    console.log('[CALENDAR EVENTS] Reservations data received:', data);
                    if (!Array.isArray(data)) {
                        console.error('[CALENDAR EVENTS] Reservations data is not an array. Data:', data);
                        failureCallback(new Error('Invalid event data format from server.'));
                        return;
                    }
                    let transformedEvents = data.map(function(res) {
                        if (!res || typeof res.date === 'undefined' || typeof res.start_time === 'undefined' || typeof res.end_time === 'undefined') {
                            console.warn('[CALENDAR EVENTS] Invalid reservation item:', res);
                            return null; 
                        }
                        return {
                            title: res.title || 'Untitled Event',
                            start: res.date + 'T' + res.start_time,
                            end: res.date + 'T' + res.end_time,
                            extendedProps: {
                                equipment_id: res.equipment_id,
                                reservation_id: res.id
                            }
                        };
                    }).filter(event => event !== null); 
                    console.log('[CALENDAR EVENTS] Transformed events for FullCalendar:', transformedEvents);
                    successCallback(transformedEvents);
                  })
                  .catch(error => {
                    console.error('[CALENDAR EVENTS] Error fetching or processing reservations:', error.message, error.stack);
                    failureCallback(error);
                  });
            }
        });
        
        console.log('[CALENDAR INIT] FullCalendar initialized. Calling render()...');
        calendar.render();
        console.log('[CALENDAR INIT] calendar.render() called.');

        if (equipmentFilterSelect && calendar) {
            equipmentFilterSelect.addEventListener('change', function() {
                console.log('[FILTER CHANGE] Filter changed to value:', this.value);
                calendar.refetchEvents();
            });
            console.log('[FILTER CHANGE] Event listener attached to #equipmentFilterSelect.');
        }

    } catch (error) {
        console.error('[CALENDAR INIT] CRITICAL Error initializing or rendering FullCalendar:', error.message, error.stack);
        if (calendarEl) {
            calendarEl.innerHTML = "<p style='color:red; font-weight:bold;'>Failed to render Calendar. Error: " + error.message + ". Check console.</p>";
        }
    }

    const confirmarReservaButton = document.getElementById('confirmarReserva');
    if (confirmarReservaButton) {
        confirmarReservaButton.addEventListener('click', function() {
            console.log('[MODAL ACTION] "Confirmar Reserva" clicked.');
            const equipment_id = document.getElementById("equipoSelect").value;
            const title = document.getElementById("tituloReserva").value.trim();

            if (!selectedStartISO || !selectedEndISO) {
                alert('Error: No hay un rango de fechas seleccionado. Por favor, seleccione un rango en el calendario.');
                console.error('[MODAL ACTION] selectedStartISO or selectedEndISO is null.');
                return;
            }
            if (!equipment_id) {
                alert('Por favor, seleccione un equipo.');
                console.warn('[MODAL ACTION] No equipment selected.');
                return;
            }
            if (!title) {
                alert('Por favor, ingrese un título para la reserva.');
                console.warn('[MODAL ACTION] No title entered.');
                return;
            }

            const startDate = new Date(selectedStartISO);
            let endDate = new Date(selectedEndISO);

            if (startDate.getTime() === endDate.getTime()) {
                console.log('[MODAL ACTION] Adjusting end time for single slot selection (1 hour default).');
                endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            }

            const reservationData = {
                equipment_id: equipment_id,
                title: title,
                date: startDate.toISOString().split('T')[0],
                start_time: startDate.toISOString().split('T')[1].substring(0, 5),
                end_time: endDate.toISOString().split('T')[1].substring(0, 5)
            };
            
            if (reservationData.date === endDate.toISOString().split('T')[0] && reservationData.end_time <= reservationData.start_time) {
                console.warn('[MODAL ACTION] End time is not after start time. Adjusting to 1 hour from start.');
                const newEndDateFromStart = new Date(startDate.getTime() + 60*60*1000);
                reservationData.end_time = newEndDateFromStart.toISOString().split('T')[1].substring(0,5);
            }
            
            console.log('[MODAL ACTION] Sending reservation data to backend:', reservationData);

            fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservationData)
            })
            .then(response => {
                console.log('[MODAL ACTION] Backend response status:', response.status, 'Ok:', response.ok);
                if (response.ok) {
                    return response.json();
                } else {
                    return response.json().then(err => {
                        console.error('[MODAL ACTION] Backend error response:', err);
                        throw err; 
                    }).catch(jsonParseError => { 
                        console.error('[MODAL ACTION] Error parsing backend JSON error response or not a JSON error:', jsonParseError, 'Original status:', response.status, response.statusText);
                        throw new Error(response.statusText || 'Error from server, not valid JSON.'); 
                    });
                }
            })
            .then(serverEvent => {
                console.log('[MODAL ACTION] Reservation successful. Server event:', serverEvent);
                if (calendar && serverEvent && serverEvent.date && serverEvent.start_time && serverEvent.end_time) {
                    calendar.addEvent({
                        title: serverEvent.title,
                        start: serverEvent.date + 'T' + serverEvent.start_time,
                        end: serverEvent.date + 'T' + serverEvent.end_time,
                        extendedProps: {
                            equipment_id: serverEvent.equipment_id,
                            reservation_id: serverEvent.id
                        }
                    });
                    console.log('[MODAL ACTION] Event added to calendar.');
                } else {
                    console.warn('[MODAL ACTION] Calendar object not available or serverEvent invalid, cannot add event to calendar. Refreshing all events instead.');
                    if(calendar) calendar.refetchEvents();
                }
                cerrarModal();
                alert('Reserva confirmada exitosamente!');
            })
            .catch(error => {
                console.error('[MODAL ACTION] Error during reservation submission:', error.message, error.stack);
                alert('Error al realizar la reserva: ' + (error.error || error.message || 'Error desconocido.'));
            });
        });
        console.log('[MODAL ACTION] Event listener attached to #confirmarReserva.');
    } else {
        console.warn('[MODAL ACTION] #confirmarReserva button not found.');
    }

    const cerrarModalButton = document.getElementById('cerrarModal');
    if (cerrarModalButton) {
        if (!cerrarModalButton.getAttribute('listenerAttached')) { 
            cerrarModalButton.addEventListener('click', cerrarModal);
            cerrarModalButton.setAttribute('listenerAttached', 'true'); 
            console.log('[MODAL ACTION] Event listener attached to #cerrarModal.');
        } else {
            console.log('[MODAL ACTION] Event listener for #cerrarModal already attached.');
        }
    } else {
        console.warn('[MODAL ACTION] #cerrarModal button not found.');
    }
});
// End of js/script.js