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
    if (!calendarEl) {
        console.error("CRITICAL: #calendar element not found.");
        if (document.body) {
             const errorDiv = document.createElement('div');
             errorDiv.innerHTML = "<h1 style='color:red;'>Error: #calendar div missing. Check HTML structure.</h1>";
             document.body.insertBefore(errorDiv, document.body.firstChild);
        }
        return;
    }

    var selectedStartISO = null; 
    var selectedEndISO = null;   
    const equipmentFilterSelect = document.getElementById('equipmentFilterSelect'); // For the filter

    // Function to open modal
    function abrirModal() {
        const tituloReserva = document.getElementById('tituloReserva');
        if(tituloReserva) tituloReserva.value = '';
        const equipoSelect = document.getElementById('equipoSelect');
        if(equipoSelect) equipoSelect.value = ""; 
        const modal = document.getElementById("modal");
        if(modal) {
            modal.style.display = "block";
            console.log("abrirModal called, modal display set to block.");
        } else {
            console.error("Modal element #modal not found");
        }
    }
    
    function cerrarModal() {
        const modal = document.getElementById("modal");
        if(modal) {
            modal.style.display = "none";
            console.log("cerrarModal called, modal display set to none.");
        } else {
            console.error("Modal element #modal for closing not found");
        }
    }

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
            console.log('Calendar select triggered:', selectionInfo); 
            selectedStartISO = selectionInfo.startStr;
            selectedEndISO = selectionInfo.endStr;
            abrirModal(); 
        },
        events: function(fetchInfo, successCallback, failureCallback) {
          const selectedEquipmentId = equipmentFilterSelect ? equipmentFilterSelect.value : "";
          let apiUrl = '/api/reservations';
          if (selectedEquipmentId) {
            apiUrl += `?equipment_id=${selectedEquipmentId}`;
          }
          fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
              let transformedEvents = data.map(function(res) {
                return {
                  title: res.title, 
                  start: res.date + 'T' + res.start_time,
                  end: res.date + 'T' + res.end_time,
                  extendedProps: { equipment_id: res.equipment_id, reservation_id: res.id }
                };
              });
              successCallback(transformedEvents);
            })
            .catch(error => {
              console.error('Error fetching reservations:', error);
              failureCallback(error); 
            });
        }
    });
    
    try {
        calendar.render();
        console.log('Calendar render() called successfully.');
    } catch (e) {
        console.error('Error calling calendar.render():', e);
        if(calendarEl) calendarEl.innerHTML = `<p style='color:red; font-weight:bold;'>Failed to render FullCalendar. Error: ${e.message}. Check console.</p>`;
    }

    // --- Start of Modified Equipment Dropdown Population ---
    // Fetch equipment for both modal and filter dropdowns
    fetch('/api/equipment')
      .then(response => {
          console.log('[DROPDOWN_POPULATION] Fetch response for /api/equipment. Status:', response.status, 'Ok:', response.ok);
          if (!response.ok) {
              console.error('[DROPDOWN_POPULATION] Network response was not ok for /api/equipment. Status text:', response.statusText);
              throw new Error('Network response was not ok for /api/equipment. Status: ' + response.status);
          }
          return response.json();
      })
      .then(equipmentList => {
        console.log('[DROPDOWN_POPULATION] Equipment list fetched and parsed:', equipmentList);

        // Populate modal select (existing robust logic)
        const equipoSelectModal = document.getElementById('equipoSelect'); 
        if (equipoSelectModal) {
            equipoSelectModal.innerHTML = '<option value="" disabled selected>Seleccione un equipo...</option>'; 
            if (Array.isArray(equipmentList)) {
                equipmentList.forEach(equipment => {
                    if (equipment && typeof equipment.id !== 'undefined' && typeof equipment.name !== 'undefined') {
                        const optionModal = document.createElement('option');
                        optionModal.value = equipment.id; 
                        optionModal.textContent = equipment.name;
                        equipoSelectModal.appendChild(optionModal);
                    }
                });
            } else {
                 console.warn('[DROPDOWN_POPULATION] equipmentList for modal is not an array. Modal select may not be populated correctly.');
            }
        }

        // Populate filter select with detailed logging
        if (equipmentFilterSelect) {
            console.log('[FILTER POPULATION] Starting to populate #equipmentFilterSelect.');
            console.log('[FILTER POPULATION] Initial #equipmentFilterSelect options count:', equipmentFilterSelect.options.length); // Should be 1

            // Clear existing options except the first one ("Todos los Equipos")
            while (equipmentFilterSelect.options.length > 1) {
                equipmentFilterSelect.remove(1);
            }
            
            if (!Array.isArray(equipmentList)) {
              console.error('[FILTER POPULATION] Fetched equipment list is not an array. Data:', equipmentList);
              const errorOption = document.createElement('option');
              errorOption.textContent = 'Error: Invalid data format';
              errorOption.disabled = true;
              equipmentFilterSelect.appendChild(errorOption);
              // Early return for filter population if data is not an array
            } else {
                if (equipmentList.length === 0) {
                    console.warn('[FILTER POPULATION] Equipment list is empty. No new options will be added beyond "Todos los Equipos".');
                }

                equipmentList.forEach((equipment, index) => {
                  console.log(`[FILTER POPULATION] Processing item ${index}:`, equipment);
                  if (equipment && typeof equipment.id !== 'undefined' && typeof equipment.name !== 'undefined') {
                    const option = document.createElement('option');
                    option.value = equipment.id;
                    option.textContent = equipment.name;
                    equipmentFilterSelect.appendChild(option);
                    console.log(`[FILTER POPULATION] Appended option: ${equipment.name} (value: ${equipment.id})`);
                  } else {
                    console.warn(`[FILTER POPULATION] Skipped invalid equipment item at index ${index}:`, equipment);
                  }
                });
            }
            console.log('[FILTER POPULATION] Finished populating #equipmentFilterSelect. Final options count:', equipmentFilterSelect.options.length);
        } else {
          console.error('[FILTER POPULATION] CRITICAL: #equipmentFilterSelect element not found in DOM during population phase.');
        }
      })
      .catch(error => {
        console.error('[DROPDOWN_POPULATION] General error during fetch or processing for equipment dropdowns:', error.message, error.stack);
        
        const equipoSelectModal = document.getElementById('equipoSelect');
        if (equipoSelectModal) {
            equipoSelectModal.innerHTML = '<option value="">Error al cargar</option>';
        }
        if (equipmentFilterSelect) {
            // Ensure "Todos los Equipos" remains and add error option
            equipmentFilterSelect.innerHTML = '<option value="">Todos los Equipos</option>'; 
            const errorOption = document.createElement('option');
            errorOption.textContent = 'Error al cargar equipos';
            errorOption.disabled = true;
            equipmentFilterSelect.appendChild(errorOption);
        }
      });
    // --- End of Modified Equipment Dropdown Population ---

    if (equipmentFilterSelect) {
        equipmentFilterSelect.addEventListener('change', function() {
            if (calendar) calendar.refetchEvents();
        });
    }
    
    const cerrarModalButton = document.getElementById('cerrarModal');
    if (cerrarModalButton) {
        cerrarModalButton.addEventListener('click', cerrarModal);
    } else {
        console.warn('#cerrarModal button not found. Modal may not close via button.');
    }

    const confirmarReservaBtn = document.getElementById("confirmarReserva");
    if (confirmarReservaBtn) {
        confirmarReservaBtn.addEventListener("click", function() {
            const equipoId = document.getElementById("equipoSelect") ? document.getElementById("equipoSelect").value : "";
            const titulo = document.getElementById("tituloReserva") ? document.getElementById("tituloReserva").value.trim() : "";
            let equipoNombre = "Equipo no seleccionado";
            const equipoSelectEl = document.getElementById('equipoSelect');
            if (equipoSelectEl) {
                const selectedOptionElement = equipoSelectEl.selectedOptions[0];
                if (selectedOptionElement && selectedOptionElement.value) { 
                    equipoNombre = selectedOptionElement.text;
                }
            }
            if (!equipoId) { alert('Por favor, selecciona un equipo.'); return; }
            if (!titulo) { alert('Por favor, ingresa un título para la reserva.'); return; }
            if (!selectedStartISO || !selectedEndISO) { alert('Por favor, selecciona un rango de tiempo en el calendario.'); return; }
            const startDate = new Date(selectedStartISO);
            let endDate = new Date(selectedEndISO);
            if (startDate.getTime() === endDate.getTime()) { endDate = new Date(startDate.getTime() + 60 * 60 * 1000); }
            const reservationData = {
                equipment_id: equipoId, title: titulo, 
                date: startDate.toISOString().split('T')[0], 
                start_time: startDate.toISOString().split('T')[1].substring(0, 5), 
                end_time: endDate.toISOString().split('T')[1].substring(0, 5) 
            };
            if (reservationData.date === endDate.toISOString().split('T')[0] && reservationData.end_time <= reservationData.start_time) {
                const newEndDate = new Date(startDate.getTime() + 60*60*1000);
                reservationData.end_time = newEndDate.toISOString().split('T')[1].substring(0,5);
            }
            fetch('/api/reservations', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(reservationData)
            })
            .then(response => {
                if (response.ok) { return response.json(); } 
                else { return response.json().then(err => { throw err; }).catch(() => { throw new Error(response.statusText || `Error ${response.status}`); }); }
            })
            .then(serverEvent => { 
                calendar.addEvent({
                    title: serverEvent.title, start: serverEvent.date + 'T' + serverEvent.start_time,
                    end: serverEvent.date + 'T' + serverEvent.end_time,
                    extendedProps: { equipment_id: serverEvent.equipment_id, reservation_id: serverEvent.id }
                });
                cerrarModal();
                alert('Reserva confirmada exitosamente!');
            })
            .catch(error => {
                console.error('Error en la reserva:', error);
                let errorMessage = 'Error desconocido.';
                if (error) {
                    if (error.error) { errorMessage = error.error; } 
                    else if (error.message) { errorMessage = error.message; } 
                    else if (typeof error === 'string') { errorMessage = error; }
                }
                alert('Error al realizar la reserva: ' + errorMessage);
            });
        });
    }
});
