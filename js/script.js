// File: js/script.js
const API_BASE_URL = 'http://127.0.0.1:5000';

function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    let selectedStartISO = null;
    let selectedEndISO = null;

    // Modal controls
    const abrirModal = () => {
        document.getElementById('tituloReserva').value = '';
        document.getElementById('equipoSelect').value = '';
        document.getElementById('modal').style.display = 'block';
    };

    const cerrarModal = () => {
        document.getElementById('modal').style.display = 'none';
    };

    // Populate dropdowns
    const equipmentFilterSelect = document.getElementById('equipmentFilterSelect');
    const equipoSelectModal = document.getElementById('equipoSelect');

    const populateEquipmentDropdowns = () => {
        fetch(`${API_BASE_URL}/api/equipment`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                [equipmentFilterSelect, equipoSelectModal].forEach(select => {
                    if (select) {
                        select.innerHTML = '<option value="">Seleccione un equipo...</option>';
                        data.forEach(equipo => {
                            const option = document.createElement('option');
                            option.value = equipo.id;
                            option.textContent = equipo.name;
                            select.appendChild(option);
                        });
                    }
                });
            })
            .catch(err => console.error('Error cargando equipos:', err));
    };

    if (!calendarEl) {
        console.error('Elemento #calendar no encontrado.');
        return;
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'es',
        selectable: true,
        editable: false,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: function (info, successCallback, failureCallback) {
            let url = `${API_BASE_URL}/api/reservations`;
            if (equipmentFilterSelect && equipmentFilterSelect.value) {
                url += `?equipment_id=${equipmentFilterSelect.value}`;
            }
            fetch(url)
                .then(res => res.ok ? res.json() : Promise.reject(res))
                .then(data => {
                    const events = data.map(r => ({
                        id: r.id,
                        title: r.title || r.equipment_name,
                        start: r.start,
                        end: r.end,
                        backgroundColor: '#007bff',
                        borderColor: '#007bff'
                    }));
                    successCallback(events);
                })
                .catch(err => {
                    console.error('Error cargando reservas:', err);
                    failureCallback(err);
                });
        },
        select: function (info) {
            selectedStartISO = info.startStr;
            selectedEndISO = info.endStr;
            abrirModal();
        }
    });

    calendar.render();

    if (equipmentFilterSelect) {
        equipmentFilterSelect.addEventListener('change', () => calendar.refetchEvents());
    }

    const confirmarReservaButton = document.getElementById('confirmarReserva');
    if (confirmarReservaButton) {
        confirmarReservaButton.addEventListener('click', () => {
            const titulo = document.getElementById('tituloReserva').value;
            const equipoId = document.getElementById('equipoSelect').value;

            if (!titulo || !equipoId || !selectedStartISO || !selectedEndISO) {
                alert('Todos los campos son obligatorios.');
                return;
            }

            const reserva = {
                title: titulo,
                equipment_id: equipoId,
                start: selectedStartISO,
                end: selectedEndISO
            };

            fetch(`${API_BASE_URL}/api/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reserva)
            })
                .then(res => res.ok ? res.json() : Promise.reject(res))
                .then(saved => {
                    calendar.addEvent({
                        id: saved.id,
                        title: saved.title,
                        start: saved.start,
                        end: saved.end
                    });
                    cerrarModal();
                })
                .catch(err => {
                    console.error('Error al guardar reserva:', err);
                    alert('Error al guardar la reserva.');
                });
        });
    }

    const cerrarModalBtn = document.getElementById('cerrarModal');
    if (cerrarModalBtn) cerrarModalBtn.addEventListener('click', cerrarModal);

    populateEquipmentDropdowns();
});