document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const equipoSelect = document.getElementById('equipoSelect');
    const filtroEquipo = document.getElementById('equipmentFilterSelect');
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modalOverlay');

    let equipos = [];
    let calendar;

    function fetchEquipos() {
        fetch('http://127.0.0.1:5000/equipos')
            .then(response => response.json())
            .then(data => {
                equipos = data;
                equipoSelect.innerHTML = '';
                filtroEquipo.innerHTML = '<option value="">Todos los Equipos</option>';
                equipos.forEach(equipo => {
                    const option = document.createElement('option');
                    option.value = equipo.id;
                    option.textContent = equipo.nombre;
                    equipoSelect.appendChild(option);

                    const filtroOption = document.createElement('option');
                    filtroOption.value = equipo.id;
                    filtroOption.textContent = equipo.nombre;
                    filtroEquipo.appendChild(filtroOption);
                });
            });
    }

    function showModal() {
        modal.style.display = 'block';
        modalOverlay.style.display = 'block';
    }

    function hideModal() {
        modal.style.display = 'none';
        modalOverlay.style.display = 'none';
    }

    function initCalendar() {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            selectable: true,
            select: function (info) {
                showModal();
                document.getElementById('confirmarReserva').onclick = () => {
                    const title = document.getElementById('tituloReserva').value;
                    const equipoId = document.getElementById('equipoSelect').value;
                    if (!title || !equipoId) {
                        alert('Por favor, completa todos los campos.');
                        return;
                    }

                    const newEvent = {
                        title: title,
                        start: info.startStr,
                        end: info.endStr,
                        equipo_id: equipoId
                    };

                    fetch('http://127.0.0.1:5000/reservas', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newEvent)
                    }).then(() => {
                        calendar.refetchEvents();
                        hideModal();
                    });
                };
            },
            events: function (fetchInfo, successCallback, failureCallback) {
                const filtro = filtroEquipo.value;
                let url = 'http://127.0.0.1:5000/reservas';
                if (filtro) {
                    url += '?equipo_id=' + filtro;
                }
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        const events = data.map(r => ({
                            title: r.title,
                            start: r.start,
                            end: r.end
                        }));
                        successCallback(events);
                    });
            }
        });
        calendar.render();
    }

    document.getElementById('cerrarModal').addEventListener('click', hideModal);
    filtroEquipo.addEventListener('change', () => calendar.refetchEvents());

    fetchEquipos();
    initCalendar();
});
