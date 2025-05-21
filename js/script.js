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
        events: function(fetchInfo, successCallback, failureCallback) {
          fetch('/api/reservations')
            .then(response => response.json())
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
          document.getElementById('tituloReserva').value = ''; 
          document.getElementById('equipoSelect').value = ""; // Reset to placeholder
          abrirModal();
        }
        // Using 'select' callback, so 'dateClick' is not the primary method for new reservations.
    });
    calendar.render();

    // Dynamically populate equipment dropdown
    fetch('/api/equipment')
      .then(response => response.json())
      .then(equipmentList => {
        const equipoSelect = document.getElementById('equipoSelect');
        equipoSelect.innerHTML = '<option value="" disabled selected>Seleccione un equipo...</option>'; 
        equipmentList.forEach(equipment => {
          const option = document.createElement('option');
          option.value = equipment.id; 
          option.text = equipment.name;
          equipoSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error fetching equipment:', error);
        document.getElementById('equipoSelect').innerHTML = '<option value="">Error al cargar equipos</option>';
      });

    function abrirModal() {
        document.getElementById("modal").style.display = "block";
    }

    function cerrarModal() {
        document.getElementById("modal").style.display = "none";
    }

    document.getElementById("confirmarReserva").addEventListener("click", function() {
        const equipoId = document.getElementById("equipoSelect").value;
        const titulo = document.getElementById("tituloReserva").value.trim();
        
        let equipoNombre = "Equipo no seleccionado";
        const selectedOptionElement = document.getElementById('equipoSelect').selectedOptions[0];
        if (selectedOptionElement && selectedOptionElement.value) { 
            equipoNombre = selectedOptionElement.text;
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

        // Handle case where start and end are the same (single click on a slot if selectable:true behaves this way)
        // Default to a 1-hour duration if so.
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
        
        // Basic validation: ensure end_time is after start_time on the same day.
        if (reservationData.date === endDate.toISOString().split('T')[0] && reservationData.end_time <= reservationData.start_time) {
            // If end time is still not after start time (e.g. sub-minute selection made it same after HH:MM conversion, or 1hr default was not enough)
            // For simplicity, create a valid 1-hour slot from the original start time
            const newEndDate = new Date(startDate.getTime() + 60*60*1000);
            reservationData.end_time = newEndDate.toISOString().split('T')[1].substring(0,5);
            // If the new end time rolls over to the next day, this logic would need to be more complex.
            // For now, we assume reservations are within the same day based on start date.
        }


        // console.log("Enviando reserva:", reservationData); // Keep for debugging if needed

        fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservationData)
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // This will be the successfully created reservation object
            } else {
                // Try to get error message from backend if it's JSON, otherwise use statusText
                return response.json().then(err => { throw err; }).catch(() => { throw new Error(response.statusText); });
            }
        })
        .then(serverEvent => { // serverEvent is the object returned by the backend on success
            calendar.addEvent({
                title: serverEvent.title, // Use title from server, it might be processed
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
            // The error object might have a 'message' property (standard Error)
            // or an 'error' property (if it's from our backend's JSON error response)
            let errorMessage = 'Error desconocido.';
            if (error) {
                if (error.error) { // Backend JSON error like { "error": "message" }
                    errorMessage = error.error;
                } else if (error.message) { // Standard JavaScript error or network error
                    errorMessage = error.message;
                } else if (typeof error === 'string') { // Fallback if error is just a string
                    errorMessage = error;
                }
            }
            alert('Error al realizar la reserva: ' + errorMessage);
        });
    });

    document.getElementById("cerrarModal").addEventListener("click", cerrarModal);
});
