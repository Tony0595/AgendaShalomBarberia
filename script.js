document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("appointmentForm");
    const notification = document.getElementById("notification");
    const adminLogin = document.getElementById("adminLogin");
    const adminSection = document.getElementById("adminSection");
    const appointmentsList = document.getElementById("appointmentsList");

    let appointments = JSON.parse(localStorage.getItem("appointments")) || [];

    // Guardar nueva cita
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const service = document.getElementById("service").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;

        // Validar nombre completo
        if (!validateFullName(name)) {
            alert("Por favor ingrese nombre y apellido");
            return;
        }

        // Validar teléfono
        if (!validatePhone(phone)) {
            alert("Por favor ingrese un número de celular válido (10 dígitos, comenzando con 3)");
            return;
        }

        if (!isValidBusinessHour(time)) {
            alert("Por favor seleccione un horario entre 8:00 AM y 6:00 PM");
            return;
        }

        if (isDateBlocked(date) || isDuplicateAppointment(date, time)) {
            alert("Fecha no disponible o ya reservada.");
            return;
        }

        const appointment = { name, phone, service, date, time };
        appointments.push(appointment);
        localStorage.setItem("appointments", JSON.stringify(appointments));

        showNotification();
        form.reset();
        updateAppointments();
    });

    // Configurar las restricciones del input de fecha
    function setupDateInput() {
        const dateInput = document.getElementById("date");
        
        // Establecer fecha mínima como hoy
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        // Actualizar horarios cuando cambie la fecha
        dateInput.addEventListener("change", (e) => {
            const selectedDate = new Date(e.target.value);
            const day = selectedDate.getUTCDay();
            
            if (day === 0 || day === 3) {
                alert("No se atiende los días miércoles ni domingos");
                e.target.value = ""; // Limpiar la selección
                setupTimeSelect(''); // Limpiar horarios
            } else {
                setupTimeSelect(e.target.value); // Actualizar horarios disponibles
            }
        });

        // Agregar evento para abrir el datepicker al hacer clic en el input
        dateInput.addEventListener("mousedown", function(e) {
            const picker = this.querySelector('::-webkit-calendar-picker-indicator');
            if (picker) {
                picker.click();
            } else {
                this.showPicker && this.showPicker();
            }
        });
    }

    // Llamar a la función cuando se carga el documento
    setupDateInput();

    // Verificar fechas bloqueadas
    function isDateBlocked(date) {
        const selectedDate = new Date(date);
        const day = selectedDate.getUTCDay(); // Usar UTCDay para evitar problemas de zona horaria
        return day === 0 || day === 3;
    }

    // Evitar turnos duplicados
    function isDuplicateAppointment(date, time) {
        return appointments.some(app => app.date === date && app.time === time);
    }

    // Mostrar notificación
    function showNotification() {
        notification.classList.remove("hidden");
        setTimeout(() => notification.classList.add("hidden"), 3000);
    }

    // Mostrar citas en el panel de admin
    function updateAppointments(filterDate = new Date().toISOString().split('T')[0]) {
        appointmentsList.innerHTML = "";
        
        // Filtrar citas por fecha
        const filteredAppointments = appointments.filter(app => app.date === filterDate);
        
        if (filteredAppointments.length === 0) {
            const li = document.createElement("li");
            li.className = "no-appointments";
            li.textContent = "No hay citas para esta fecha";
            appointmentsList.appendChild(li);
            return;
        }

        // Ordenar citas por hora
        filteredAppointments.sort((a, b) => a.time.localeCompare(b.time));

        filteredAppointments.forEach(app => {
            const li = document.createElement("li");
            
            // Crear contenedor para la hora
            const timeDiv = document.createElement("div");
            timeDiv.className = "appointment-time";
            timeDiv.textContent = formatTime12Hours(app.time);
            
            // Crear contenedor para la información
            const infoDiv = document.createElement("div");
            infoDiv.className = "appointment-info";
            
            // Nombre del cliente
            const nameDiv = document.createElement("div");
            nameDiv.className = "appointment-name";
            nameDiv.textContent = app.name;
            
            // Servicio
            const serviceDiv = document.createElement("div");
            serviceDiv.className = "appointment-service";
            serviceDiv.textContent = app.service;
            
            // Teléfono
            const phoneDiv = document.createElement("div");
            phoneDiv.className = "appointment-phone";
            phoneDiv.textContent = `Tel: ${app.phone}`;
            
            // Agregar elementos al contenedor de información
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(serviceDiv);
            infoDiv.appendChild(phoneDiv);
            
            // Agregar elementos al li
            li.appendChild(timeDiv);
            li.appendChild(infoDiv);
            
            appointmentsList.appendChild(li);
        });
    }

    // Función para convertir hora a formato 12 horas
    function formatTime12Hours(time24) {
        const [hours, minutes] = time24.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes} ${period}`;
    }

    // Configurar las opciones de tiempo disponibles
    function setupTimeSelect(selectedDate = '') {
        const timeSelect = document.getElementById("time");
        timeSelect.innerHTML = ''; // Limpiar opciones existentes
        
        // Agregar la opción por defecto
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Seleccione un horario";
        timeSelect.appendChild(defaultOption);
        
        // Si no hay fecha seleccionada, no mostrar horarios
        if (!selectedDate) {
            return;
        }

        // Obtener horarios ya agendados para la fecha seleccionada
        const bookedTimes = appointments
            .filter(app => app.date === selectedDate)
            .map(app => app.time);
        
        // Primera parte del día: 8:00 AM a 12:00 PM
        for (let hour = 8; hour < 12; hour++) {
            // Hora en punto
            const time1 = `${hour.toString().padStart(2, '0')}:00`;
            if (!bookedTimes.includes(time1)) {
                const option1 = document.createElement("option");
                option1.value = time1;
                option1.textContent = formatTime12Hours(time1);
                timeSelect.appendChild(option1);
            }
            
            // Media hora
            const time2 = `${hour.toString().padStart(2, '0')}:30`;
            if (!bookedTimes.includes(time2)) {
                const option2 = document.createElement("option");
                option2.value = time2;
                option2.textContent = formatTime12Hours(time2);
                timeSelect.appendChild(option2);
            }
        }
        
        // Segunda parte del día: 2:00 PM a 6:00 PM
        for (let hour = 14; hour < 18; hour++) {
            // Hora en punto
            const time1 = `${hour.toString().padStart(2, '0')}:00`;
            if (!bookedTimes.includes(time1)) {
                const option1 = document.createElement("option");
                option1.value = time1;
                option1.textContent = formatTime12Hours(time1);
                timeSelect.appendChild(option1);
            }
            
            // Media hora
            const time2 = `${hour.toString().padStart(2, '0')}:30`;
            if (!bookedTimes.includes(time2)) {
                const option2 = document.createElement("option");
                option2.value = time2;
                option2.textContent = formatTime12Hours(time2);
                timeSelect.appendChild(option2);
            }
        }

        // Si no hay horarios disponibles, mostrar mensaje
        if (timeSelect.options.length === 1) {
            const noTimesOption = document.createElement("option");
            noTimesOption.value = "";
            noTimesOption.textContent = "No hay horarios disponibles para esta fecha";
            timeSelect.appendChild(noTimesOption);
        }
    }

    // Llamar a setupTimeSelect cuando se carga el documento
    setupTimeSelect();

    // Modificar la función isValidBusinessHour
    function isValidBusinessHour(time) {
        const [hours, minutes] = time.split(':').map(Number);
        
        // Bloquear horarios de 12:00 a 14:00 (2 PM)
        if (hours >= 12 && hours < 14) {
            return false;
        }
        
        // Verificar horario de trabajo (8:00 AM a 6:00 PM)
        if (hours < 8 || hours >= 18) {
            return false;
        }
        
        // Solo permitir minutos en 00 o 30
        return minutes === 0 || minutes === 30;
    }

    // Acceso administrador
    adminLogin.addEventListener("click", () => {
        const password = prompt("Ingrese la contraseña de administrador:");
        if (password === "Am05.02*") {
            adminSection.classList.remove("hidden");
            
            // Configurar fecha actual en el filtro
            const filterDate = document.getElementById("filterDate");
            const today = new Date().toISOString().split('T')[0];
            filterDate.value = today;
            
            // Mostrar citas del día actual
            updateAppointments(today);
            
            // Agregar event listeners para filtrado
            filterDate.addEventListener("change", (e) => {
                updateAppointments(e.target.value);
            });

            document.getElementById("todayButton").addEventListener("click", () => {
                const today = new Date().toISOString().split('T')[0];
                filterDate.value = today;
                updateAppointments(today);
            });
        } else {
            alert("Contraseña incorrecta.");
        }
    });

    // Actualizar lista al cargar la página
    updateAppointments();

    // Agregar estas funciones de validación
    function validatePhone(phone) {
        // Formato colombiano: 10 dígitos, puede empezar con 3
        const phoneRegex = /^3\d{9}$/;
        return phoneRegex.test(phone);
    }

    function validateFullName(name) {
        // Verificar que tenga al menos dos palabras (nombre y apellido)
        const nameParts = name.trim().split(/\s+/);
        return nameParts.length >= 2 && nameParts.every(part => part.length >= 2);
    }

    // Agregar validación en tiempo real para el campo de teléfono
    document.getElementById("phone").addEventListener("input", function(e) {
        let value = e.target.value;
        
        // Remover cualquier caracter que no sea número
        value = value.replace(/\D/g, '');
        
        // Limitar a 10 dígitos
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        
        e.target.value = value;
    });

    // Agregar placeholder más descriptivo al campo de nombre
    document.getElementById("name").placeholder = "Nombre y Apellido";
});