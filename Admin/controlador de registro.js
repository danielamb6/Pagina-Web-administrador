// ============================================
// CONTROLADOR DE PÁGINA DE REGISTRO
// ============================================

class RegistroController {
    constructor() {
        this.usuarioEditando = null;
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.cargarElementos();
            this.configurarEventos();
            this.cargarUsuarios();
            this.verificarPermisos();
        });
    }
    
    cargarElementos() {
        this.form = document.getElementById('usuarioForm');
        this.inputNombre = document.getElementById('nombre');
        this.inputEmail = document.getElementById('email');
        this.inputUsername = document.getElementById('username');
        this.inputPassword = document.getElementById('password');
        this.inputConfirmPassword = document.getElementById('confirmPassword');
        this.selectRol = document.getElementById('rol');
        this.selectEmpresa = document.getElementById('empresa');
        this.inputId = document.getElementById('usuarioId');
        this.btnGuardar = document.getElementById('btnGuardar');
        this.btnCancelar = document.getElementById('btnCancelar');
        this.btnNuevo = document.getElementById('btnNuevoUsuario');
        this.inputBuscar = document.getElementById('buscarUsuario');
        this.tablaUsuarios = document.getElementById('tablaUsuarios');
    }
    
    configurarEventos() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.guardarUsuario(e));
        }
        
        if (this.btnNuevo) {
            this.btnNuevo.addEventListener('click', () => this.nuevoUsuario());
        }
        
        if (this.btnCancelar) {
            this.btnCancelar.addEventListener('click', () => this.cancelarEdicion());
        }
        
        if (this.inputBuscar) {
            this.inputBuscar.addEventListener('input', (e) => this.buscarUsuarios(e.target.value));
        }
        
        // Validación en tiempo real de contraseña
        if (this.inputPassword) {
            this.inputPassword.addEventListener('input', () => this.validarPasswordEnTiempoReal());
        }
        
        if (this.inputConfirmPassword) {
            this.inputConfirmPassword.addEventListener('input', () => this.validarPasswordEnTiempoReal());
        }
    }
    
    verificarPermisos() {
        // Solo administradores pueden gestionar usuarios
        const usuarioActual = auth.obtenerUsuarioActual();
        if (!usuarioActual || usuarioActual.rol !== 'administrador') {
            util.mostrarError('No tienes permisos para gestionar usuarios. Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 2000);
        }
    }
    
    async cargarUsuarios(filtro = '') {
        try {
            const usuarios = usuarioService.buscarUsuarios(filtro);
            this.renderizarTabla(usuarios);
        } catch (error) {
            util.mostrarError('Error al cargar usuarios: ' + error.message);
        }
    }
    
    renderizarTabla(usuarios) {
        if (!this.tablaUsuarios) return;
        
        this.tablaUsuarios.innerHTML = '';
        
        usuarios.forEach(usuario => {
            const fila = document.createElement('tr');
            
            let claseRol = '';
            let rolTexto = '';
            switch(usuario.rol) {
                case 'administrador': 
                    claseRol = 'role-admin'; 
                    rolTexto = 'Administrador';
                    break;
                case 'tecnico': 
                    claseRol = 'role-tecnico'; 
                    rolTexto = 'Técnico';
                    break;
                default:
                    claseRol = 'role-usuario';
                    rolTexto = usuario.rol || 'Usuario';
            }
            
            fila.innerHTML = `
                <td>${usuario.nombre}</td>
                <td><strong>${usuario.username}</strong></td>
                <td>${usuario.email}</td>
                <td><span class="role-badge ${claseRol}">${rolTexto}</span></td>
                <td>${usuario.empresa || '-'}</td>
                <td class="${usuario.activo ? 'status-active' : 'status-inactive'}">
                    <i class="fas fa-circle"></i> 
                    ${usuario.activo ? ' Activo' : ' Inactivo'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="registroController.editarUsuario(${usuario.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-toggle" onclick="registroController.cambiarEstadoUsuario(${usuario.id}, ${!usuario.activo})" title="${usuario.activo ? 'Desactivar' : 'Activar'}">
                            <i class="fas fa-power-off"></i>
                        </button>
                    </div>
                </td>
            `;
            this.tablaUsuarios.appendChild(fila);
        });
    }
    
    async guardarUsuario(e) {
        e.preventDefault();
        
        if (!this.validarFormulario()) {
            return;
        }
        
        try {
            const usuarioData = this.obtenerDatosFormulario();
            
            // Validar unicidad de credenciales
            const usuarioExistente = usuarioService.validarCredencialesUnicas(
                usuarioData.username, 
                usuarioData.email, 
                usuarioData.id || null
            );
            
            if (usuarioExistente) {
                util.mostrarError('El nombre de usuario o email ya están registrados');
                return;
            }
            
            // Mostrar estado de carga
            this.estadoCargando(true, 'Guardando...');
            
            // Guardar usuario
            await usuarioService.guardarUsuario(usuarioData);
            
            // Recargar tabla
            await this.cargarUsuarios();
            
            // Limpiar formulario
            this.limpiarFormulario();
            
            // Mostrar éxito
            this.estadoCargando(false);
            util.mostrarExito(`Usuario ${usuarioData.id ? 'actualizado' : 'registrado'} exitosamente`);
            
        } catch (error) {
            this.estadoCargando(false);
            util.mostrarError('Error al guardar usuario: ' + error.message);
        }
    }
    
    validarFormulario() {
        // Validar campos requeridos
        if (!this.inputNombre.value.trim()) {
            util.mostrarError('El nombre es requerido');
            this.inputNombre.focus();
            return false;
        }
        
        if (!this.inputEmail.value.trim()) {
            util.mostrarError('El email es requerido');
            this.inputEmail.focus();
            return false;
        }
        
        if (!util.validarEmail(this.inputEmail.value)) {
            util.mostrarError('Ingresa un email válido');
            this.inputEmail.focus();
            return false;
        }
        
        if (!this.inputUsername.value.trim()) {
            util.mostrarError('El nombre de usuario es requerido');
            this.inputUsername.focus();
            return false;
        }
        
        if (!this.selectRol.value) {
            util.mostrarError('Debes seleccionar un rol');
            this.selectRol.focus();
            return false;
        }
        
        // Validar contraseña (solo para nuevos usuarios o si se cambia)
        if (!this.usuarioEditando || this.inputPassword.value) {
            if (!this.inputPassword.value) {
                util.mostrarError('La contraseña es requerida');
                this.inputPassword.focus();
                return false;
            }
            
            if (!util.validarPassword(this.inputPassword.value)) {
                util.mostrarError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
                this.inputPassword.focus();
                return false;
            }
            
            if (this.inputPassword.value !== this.inputConfirmPassword.value) {
                util.mostrarError('Las contraseñas no coinciden');
                this.inputConfirmPassword.focus();
                return false;
            }
        }
        
        return true;
    }
    
    validarPasswordEnTiempoReal() {
        if (!this.inputPassword || !this.inputConfirmPassword) return;
        
        const password = this.inputPassword.value;
        const confirmPassword = this.inputConfirmPassword.value;
        
        // Resetear estilos
        this.inputPassword.style.borderColor = '';
        this.inputConfirmPassword.style.borderColor = '';
        
        if (password && !util.validarPassword(password)) {
            this.inputPassword.style.borderColor = 'var(--warning)';
        } else if (password && util.validarPassword(password)) {
            this.inputPassword.style.borderColor = 'var(--success)';
        }
        
        if (confirmPassword) {
            if (password !== confirmPassword) {
                this.inputConfirmPassword.style.borderColor = 'var(--danger)';
            } else if (password === confirmPassword && password.length > 0) {
                this.inputConfirmPassword.style.borderColor = 'var(--success)';
            }
        }
    }
    
    obtenerDatosFormulario() {
        const datos = {
            id: this.inputId.value ? parseInt(this.inputId.value) : null,
            nombre: this.inputNombre.value,
            email: this.inputEmail.value,
            username: this.inputUsername.value,
            rol: this.selectRol.value,
            empresa: this.selectEmpresa.value,
            activo: true, // Por defecto activo
            fechaRegistro: new Date().toISOString().split('T')[0]
        };
        
        // Solo incluir password si se proporcionó uno nuevo
        if (this.inputPassword.value) {
            datos.password = this.inputPassword.value;
        } else if (this.usuarioEditando && this.usuarioEditando.password) {
            // Mantener la contraseña anterior si no se cambia
            datos.password = this.usuarioEditando.password;
        }
        
        return datos;
    }
    
    nuevoUsuario() {
        this.limpiarFormulario();
        // Scroll suave al formulario
        if (document.getElementById('formRegistro')) {
            document.getElementById('formRegistro').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }
    
    cancelarEdicion() {
        this.limpiarFormulario();
    }
    
    limpiarFormulario() {
        if (this.form) {
            this.form.reset();
            this.inputId.value = '';
            this.btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Usuario';
            this.usuarioEditando = null;
            
            // Restaurar bordes de contraseña
            if (this.inputPassword) {
                this.inputPassword.style.borderColor = '';
            }
            if (this.inputConfirmPassword) {
                this.inputConfirmPassword.style.borderColor = '';
            }
        }
    }
    
    async editarUsuario(id) {
        try {
            const usuario = usuarioService.obtenerUsuarioPorId(id);
            
            if (usuario) {
                this.usuarioEditando = usuario;
                
                // Llenar formulario
                this.inputId.value = usuario.id;
                this.inputNombre.value = usuario.nombre;
                this.inputEmail.value = usuario.email;
                this.inputUsername.value = usuario.username;
                this.selectRol.value = usuario.rol;
                this.selectEmpresa.value = usuario.empresa || '';
                
                // Clear password fields for editing (user can leave empty to keep current)
                this.inputPassword.value = '';
                this.inputConfirmPassword.value = '';
                
                // Cambiar texto del botón
                this.btnGuardar.innerHTML = '<i class="fas fa-save"></i> Actualizar Usuario';
                
                // Scroll al formulario
                if (document.getElementById('formRegistro')) {
                    document.getElementById('formRegistro').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }
            }
        } catch (error) {
            util.mostrarError('Error al cargar usuario: ' + error.message);
        }
    }
    
    async cambiarEstadoUsuario(id, nuevoEstado) {
        try {
            const usuario = usuarioService.obtenerUsuarioPorId(id);
            
            if (!usuario) {
                util.mostrarError('Usuario no encontrado');
                return;
            }
            
            // Confirmar acción
            const accion = nuevoEstado ? 'activar' : 'desactivar';
            const confirmacion = confirm(`¿Estás seguro de ${accion} a ${usuario.nombre}?`);
            
            if (!confirmacion) {
                return;
            }
            
            // Cambiar estado
            await usuarioService.cambiarEstadoUsuario(id, nuevoEstado);
            
            // Recargar tabla
            await this.cargarUsuarios();
            
            // Mostrar mensaje
            util.mostrarExito(`Usuario ${accion}do exitosamente`);
            
        } catch (error) {
            util.mostrarError('Error al cambiar estado: ' + error.message);
        }
    }
    
    async buscarUsuarios(termino) {
        await this.cargarUsuarios(termino);
    }
    
    estadoCargando(cargando, mensaje = null) {
        if (!this.btnGuardar) return;
        
        if (cargando) {
            this.btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + mensaje;
            this.btnGuardar.disabled = true;
        } else {
            const texto = this.usuarioEditando ? 'Actualizar Usuario' : 'Guardar Usuario';
            this.btnGuardar.innerHTML = `<i class="fas fa-save"></i> ${texto}`;
            this.btnGuardar.disabled = false;
        }
    }
}

// Inicializar controlador cuando se cargue la página
let registroController;
document.addEventListener('DOMContentLoaded', () => {
    registroController = new RegistroController();
});

// Hacer disponible globalmente para los botones onclick
window.registroController = registroController;