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
    const equipmentFilterSelect = document.getElementById('equipmentFilterSelect'); // For the filter

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'es',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay' // Added dayGridDay for more view options
        },
        editable: true, 
        selectable: true, 
        events: function(fetchInfo, successCallback, failureCallback) {
          let apiUrl = '/api/reservations';
          const selectedEquipmentId = equipmentFilterSelect ? equipmentFilterSelect.value : ""; // Check if filter select exists
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
                  extendedProps: {
                    equipment_id: res.equipment_id,
                    reservation_id: res.id 
                  }
                };
              });
              successCallback(transformedEvents);
            })
            .catch(error => {
              console.error('Error fetching reservations:', error);
              failureCallback(error); 
            });
        },
        select: function(selectionInfo) {
          selectedStartISO = selectionInfo.startStr;
          selectedEndISO = selectionInfo.endStr;
          // Field resets moved to abrirModal
          abrirModal();
        }
    });
    calendar.render();

    // Dynamically populate equipment dropdowns (modal and filter)
    fetch('/api/equipment')
      .then(response => {
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
      })
      .then(equipmentList => {
        const equipoSelectModal = document.getElementById('equipoSelect'); 
        if (equipoSelectModal) {
            equipoSelectModal.innerHTML = '<option value="" disabled selected>Seleccione un equipo...</option>'; 
            equipmentList.forEach(equipment => {
              const optionModal = document.createElement('option');
              optionModal.value = equipment.id; 
              optionModal.text = equipment.name;
              equipoSelectModal.appendChild(optionModal);
            });
        }

        if (equipmentFilterSelect) { // Check if filter select exists on the page
            while (equipmentFilterSelect.options.length > 1) { // Keep "Todos los Equipos"
                equipmentFilterSelect.remove(1);
            }
            equipmentList.forEach(equipment => {
              const optionFilter = document.createElement('option');
              optionFilter.value = equipment.id;
              optionFilter.text = equipment.name;
              equipmentFilterSelect.appendChild(optionFilter);
            });
        }
      })
      .catch(error => {
        console.error('Error fetching equipment for dropdowns:', error);
        const equipoSelectModal = document.getElementById('equipoSelect');
        if (equipoSelectModal) equipoSelectModal.innerHTML = '<option value="">Error al cargar equipos</option>';
        
        if (equipmentFilterSelect) { // Check if filter select exists
            equipmentFilterSelect.innerHTML = '<option value="">Error al cargar filtros</option>'; 
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.text = "Todos los Equipos";
            equipmentFilterSelect.insertBefore(defaultOption, equipmentFilterSelect.firstChild);
        }
      });

    // Event listener for the filter, if it exists
    if (equipmentFilterSelect) {
        equipmentFilterSelect.addEventListener('change', function() {
            calendar.refetchEvents();
        });
    }

    function abrirModal() {
        const modal = document.getElementById("modal");
        if (modal) {
            modal.style.display = "block";
            // Reset form fields when opening
            const tituloReservaEl = document.getElementById('tituloReserva');
            if (tituloReservaEl) tituloReservaEl.value = '';
            
            const equipoSelectEl = document.getElementById('equipoSelect');
            if (equipoSelectEl) equipoSelectEl.value = ""; // Reset to the placeholder which should have value=""
        }
    }

    function cerrarModal() {
        const modal = document.getElementById("modal");
        if (modal) modal.style.display = "none";
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

            if (!equipoId) { 
                alert('Por favor, selecciona un equipo.');
                return;
            }
            if (!titulo) {
                alert('Por favor, ingresa un título para la reserva.');
                return;
            }
            if (!selectedStartISO || !selectedEndISO) {
                alert('Por favor, selecciona un rango de tiempo en el calendario.');
                return;
            }

            const startDate = new Date(selectedStartISO);
            let endDate = new Date(selectedEndISO);

            if (startDate.getTime() === endDate.getTime()) {
                endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
            }

            const reservationData = {
                equipment_id: equipoId,
                title: titulo, 
                date: startDate.toISOString().split('T')[0], 
                start_time: startDate.toISOString().split('T')[1].substring(0, 5), 
                end_time: endDate.toISOString().split('T')[1].substring(0, 5) 
            };
            
            if (reservationData.date === endDate.toISOString().split('T')[0] && reservationData.end_time <= reservationData.start_time) {
                const newEndDate = new Date(startDate.getTime() + 60*60*1000);
                reservationData.end_time = newEndDate.toISOString().split('T')[1].substring(0,5);
            }

            fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            })
            .then(response => {
                if (response.ok) {
                return response.json(); // This is the created reservation object from the server
                } else {
                // Try to parse error as JSON, otherwise use statusText
                    return response.json().then(err => { throw err; }).catch(() => { throw new Error(response.statusText || `Error ${response.status}`); });
                }
            })
        .then(serverEvent => { // serverEvent is the object returned by the backend
            // Add the event returned by the server to the calendar
            calendar.addEvent({
                title: serverEvent.title, // Use title from server response
                start: serverEvent.date + 'T' + serverEvent.start_time,
                end: serverEvent.date + 'T' + serverEvent.end_time,
                extendedProps: {
                    equipment_id: serverEvent.equipment_id,
                    reservation_id: serverEvent.id // Assuming 'id' is the reservation ID from backend
                }
            });
                cerrarModal();
                alert('Reserva confirmada exitosamente!');
            })
            .catch(error => {
                console.error('Error en la reserva:', error);
                let errorMessage = 'Error desconocido.';
                if (error) {
                    if (error.error) { 
                        errorMessage = error.error;
                    } else if (error.message) { 
                        errorMessage = error.message;
                    } else if (typeof error === 'string') { 
                        errorMessage = error;
                    }
                }
                alert('Error al realizar la reserva: ' + errorMessage);
            });
        });
    }

    const cerrarModalBtn = document.getElementById("cerrarModal");
    if (cerrarModalBtn) {
        cerrarModalBtn.addEventListener("click", cerrarModal);
    }
});
